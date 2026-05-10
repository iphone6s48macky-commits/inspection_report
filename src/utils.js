export function encodeReportData(data) {
  const json = JSON.stringify(data);
  return btoa(encodeURIComponent(json));
}

export function decodeReportData(str) {
  return JSON.parse(decodeURIComponent(atob(str)));
}

export function resizePhoto(file, maxWidth = 400, quality = 0.6) {
  return new Promise((resolve) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = blobUrl;
  });
}

export function getReportUrl(data, includePhotos = true) {
  const payload = { ...data };
  if (!includePhotos) delete payload.photos;
  const base = `${window.location.origin}${import.meta.env.BASE_URL}report.html`;
  return `${base}?data=${encodeURIComponent(encodeReportData(payload))}`;
}
