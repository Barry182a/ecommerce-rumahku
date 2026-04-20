import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
 
// PENTING: Jika folder 'app' kamu juga ada di dalam 'src', gunakan path ini:
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// TAPI, jika folder 'app' kamu ada di LUAR 'src' (di root), gunakan ini:
// import type { OurFileRouter } from "@/app/api/uploadthing/core";
 
export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();