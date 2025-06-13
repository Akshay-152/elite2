async function handleImageUpload(inputEl, hiddenInputId) {
  const file = inputEl.files[0];
  if (!file) return;

  const cloudNames = [
        "de7bwqvq5", "drooohxav", "ddbphbdqs",
        "druu17mog", "dm1v8tw9q", "dg5i9tang", "defeqmzcz"
      ];

  const selectedCloud = cloudNames[Math.floor(Math.random() * cloudNames.length)];

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "myupload");

  const statusText = document.getElementById(`imageStatus${hiddenInputId.slice(-1)}`);
  if (statusText) {
    statusText.textContent = "⏳ Uploading...";
    statusText.classList.remove("text-emerald-600");
    statusText.classList.add("text-yellow-600");
    statusText.classList.remove("hidden");
  }

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${selectedCloud}/image/upload`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Upload failed. try again ");

    const data = await res.json();
    const imageUrl = data.secure_url;

    // Set the hidden input value
    document.getElementById(hiddenInputId).value = imageUrl;

    if (statusText) {
      statusText.textContent = "✅ Image uploaded successfully!";
      statusText.classList.remove("text-yellow-600");
      statusText.classList.add("text-emerald-600");
    }

    showSuccess("Image uploaded!");
  } catch (err) {
    alert("❌ Upload failed: " + err.message);
    if (statusText) {
      statusText.textContent = "❌ Upload failed";
      statusText.classList.remove("text-emerald-600");
      statusText.classList.add("text-red-600");
    }
  }
}
