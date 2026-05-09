import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ReportViewer from "./ReportViewer.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ReportViewer />
  </StrictMode>
);
