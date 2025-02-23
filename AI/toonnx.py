import onnx
import tensorflow as tf
import tf2onnx
from onnxruntime.transformers.optimizer import optimize_model

# Load the Keras model
model = tf.keras.models.load_model("emotion_detection_model_for_streamlit.h5")

# Print the input shape (expected to be (None, 48, 48, 3))
print("Model input shape:", model.input_shape)

# Manually set the output_names attribute if it doesn't exist.
if not hasattr(model, "output_names") or model.output_names is None:
    model.output_names = [f"output_{i}" for i in range(len(model.outputs))]

# Create an input signature from model input shape.
input_signature = [tf.TensorSpec(model.input_shape, tf.float32, name="input")]

# Convert the model to ONNX. Adjust the opset version if needed.
model_proto, _ = tf2onnx.convert.from_keras(
    model,
    input_signature=input_signature,
    opset=13,
)

# Save the plain ONNX model to a temporary file
onnx_file = "emotion_detection_model_for_streamlit.onnx"
onnx.save(model_proto, onnx_file)
print(f"ONNX model saved as '{onnx_file}'.")

# Optimize the ONNX model using ONNX Runtime optimizer.
# Adjust "model_type" based on your model requirements.
optimized_model = optimize_model(onnx_file, model_type="bert")

# Save the optimized model with .ort extension
ort_file = "emotion_detection_model_for_streamlit.ort"
optimized_model.save_model_to_file(ort_file)
print(f"Conversion complete. Optimized ORT model saved as '{ort_file}'.")
