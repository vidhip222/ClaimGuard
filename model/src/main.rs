use std::env::set_var;

use axum::{extract::Query, routing::get, Router};
use image::{imageops::FilterType, load_from_memory};
use lambda_http::{run, tracing, Error};
use ndarray::Array4;
use ort::session::{builder::GraphOptimizationLevel, Session};
use serde::Deserialize;
use sst_sdk::Resource;
use tokio::io::AsyncReadExt;

#[derive(Deserialize, Debug)]
struct Bucket {
    name: String,
}

#[derive(Deserialize, Debug)]
struct InferenceQuery {
    key: String,
}

const EMOTIONS: [&str; 5] = ["ANGRY", "HAPPY", "SAD", "SURPRISE", "NEUTRAL"];

async fn inference(params: Query<InferenceQuery>) -> String {
    let model = Session::builder()
        .unwrap()
        .with_optimization_level(GraphOptimizationLevel::Level3)
        .unwrap()
        .with_intra_threads(4)
        .unwrap()
        .commit_from_memory_directly(include_bytes!("../emotion_model.onnx"))
        .unwrap();

    let config = aws_config::load_from_env().await;
    let client = aws_sdk_s3::Client::new(&config);
    let resource = Resource::init().unwrap();
    let Bucket { name } = resource.get("Bucket").unwrap();

    let resp = client
        .get_object()
        .bucket(name)
        .key(params.key.clone())
        .send()
        .await
        .unwrap();

    let mut byte_stream = resp.body.into_async_read();
    let mut img = Vec::new();
    byte_stream.read_to_end(&mut img).await.unwrap();

    // Decode the image from the byte buffer.
    let dyn_img = load_from_memory(&img).expect("Failed to decode image");
    // Convert to an RGB image (if not already in that format).
    let rgb_img = dyn_img.to_rgb8();
    // Resize the image to 48x48 (using a Lanczos filter similar to cv2.INTER_LANCZOS4).
    let resized = image::imageops::resize(&rgb_img, 48, 48, FilterType::Lanczos3);

    // Create a 4D ndarray (batch size 1, 48 height, 48 width, 3 channels).
    let (width, height) = resized.dimensions();
    let mut input_tensor = Array4::<f32>::zeros((1, height as usize, width as usize, 3));

    // Iterate over the resized image pixels and process each pixel.
    // The Python code computes the grayscale value by averaging the channels,
    // normalizes it by dividing by 255, and then replicates it over three channels.
    for y in 0..height as usize {
        for x in 0..width as usize {
            let pixel = resized.get_pixel(x as u32, y as u32);
            let gray = (pixel[0] as f32 + pixel[1] as f32 + pixel[2] as f32) / 3.0 / 255.0;
            input_tensor[[0, y, x, 0]] = gray;
            input_tensor[[0, y, x, 1]] = gray;
            input_tensor[[0, y, x, 2]] = gray;
        }
    }

    // Now, input_tensor has the proper shape (1, 48, 48, 3) and normalized values.
    // You can pass it to the ONNX model using your ort session, for example:
    let outputs = model
        .run(ort::inputs![input_tensor].unwrap())
        .expect("Failed to run inference");

    let outputs: Vec<f32> = outputs
        .get("output_0")
        .unwrap()
        .try_extract_tensor::<f32>()
        .unwrap()
        .to_slice()
        .unwrap()
        .to_vec();

    println!("Outputs: {:?}", outputs);

    let max_index = outputs
        .iter()
        .enumerate()
        .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap())
        .unwrap()
        .0;

    println!("Max index: {}", max_index);

    let emotion = EMOTIONS[max_index];

    return emotion.to_string();
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    // If you use API Gateway stages, the Rust Runtime will include the stage name
    // as part of the path that your application receives.
    // Setting the following environment variable, you can remove the stage from the path.
    // This variable only applies to API Gateway stages,
    // you can remove it if you don't use them.
    // i.e with: `GET /test-stage/todo/id/123` without: `GET /todo/id/123`
    set_var("AWS_LAMBDA_HTTP_IGNORE_STAGE_IN_PATH", "true");

    tracing::init_default_subscriber();

    println!("Loaded model",);

    let app = Router::new().route("/", get(inference));

    run(app).await
}
