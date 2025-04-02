# download_models.py
import requests

def download_file(url, filename):
    r = requests.get(url)
    with open(filename, 'wb') as f:
        f.write(r.content)

# PLACEHOLDER: Replace with actual URLs for the models
download_file("https://yourdomain.com/models/caformer_b36.onnx", "models/caformer_b36.onnx")
download_file("https://yourdomain.com/models/mit_unet.onnx", "models/mit_unet.onnx")
