import streamlit as st
import tensorflow as tf
import numpy as np
import cv2
import tempfile
import os

# Load the pre-trained model
model = tf.keras.models.load_model("emotion_detection_model_for_streamlit.h5")

# Define emotion categories
EMOTIONS = ['ANGRY', 'HAPPY', 'SAD', 'SURPRISE', 'NEUTRAL']

# Function to process video frames
def process_video(uploaded_file):
    # Temporarily save the uploaded video to disk
    with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
        tmp_file.write(uploaded_file.read())
        temp_video_path = tmp_file.name
    
    cap = cv2.VideoCapture(temp_video_path)
    frame_num = 0
    stframe = st.empty()  # Streamlit container to display frames
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Process the frame to get emotion prediction
        resized = cv2.resize(frame, (48, 48), interpolation=cv2.INTER_LANCZOS4)
        gray_1d = np.mean(resized, axis=-1)  # Convert to grayscale
        gray = np.zeros_like(resized)
        gray[:, :, 0] = gray_1d
        gray[:, :, 1] = gray_1d
        gray[:, :, 2] = gray_1d
        normalized = gray / 255.0  # Normalize

        model_input = np.expand_dims(normalized, 0)
        scores = model.predict(model_input).flatten()
        prediction = EMOTIONS[np.argmax(scores)]  # Get the predicted emotion
        
        # Display the frame with prediction
        cv2.putText(frame, f"Emotion: {prediction}", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        stframe.image(frame, channels="BGR", use_container_width=True)
    
    cap.release()
    os.remove(temp_video_path)  # Remove the temporary video file

# UI for video upload only
st.title("Emotion Detection from Video")
st.header("Upload a video for emotion analysis.")

# Allow only video files to be uploaded
uploaded_file = st.file_uploader("Upload a video", type=["mp4", "mov", "avi"])

if uploaded_file is not None:
    # Display the uploaded video
    st.video(uploaded_file)
    
    # Process the video
    process_video(uploaded_file)
