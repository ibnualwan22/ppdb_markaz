import Swal from "sweetalert2";

// Tema konsisten biru-putih
const defaultConfig = {
  confirmButtonColor: "#2563eb",
  cancelButtonColor: "#94a3b8",
  customClass: {
    popup: "rounded-2xl",
    confirmButton: "rounded-xl font-bold",
    cancelButton: "rounded-xl font-bold",
  },
};

export const swalSuccess = (title: string, text?: string) =>
  Swal.fire({
    ...defaultConfig,
    icon: "success",
    title,
    text,
    timer: 2000,
    showConfirmButton: false,
    timerProgressBar: true,
  });

export const swalError = (title: string, text?: string) =>
  Swal.fire({
    ...defaultConfig,
    icon: "error",
    title,
    text,
  });

export const swalInfo = (title: string, text?: string) =>
  Swal.fire({
    ...defaultConfig,
    icon: "info",
    title,
    text,
    timer: 2500,
    showConfirmButton: false,
    timerProgressBar: true,
  });

export const swalConfirm = (title: string, text?: string, confirmText = "Ya, Lanjutkan") =>
  Swal.fire({
    ...defaultConfig,
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Batal",
    reverseButtons: true,
  });

export const swalDanger = (title: string, text?: string, confirmText = "Ya, Hapus!") =>
  Swal.fire({
    ...defaultConfig,
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    confirmButtonText: confirmText,
    cancelButtonText: "Batal",
    reverseButtons: true,
  });

export const swalInput = (title: string, inputValue?: string, inputLabel?: string) =>
  Swal.fire({
    ...defaultConfig,
    title,
    input: "text",
    inputLabel,
    inputValue: inputValue || "",
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal",
    inputValidator: (value) => {
      if (!value) return "Tidak boleh kosong!";
    },
  });

// Toast notification (pojok kanan atas)
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

export const swalToast = (icon: "success" | "error" | "info" | "warning", title: string) =>
  Toast.fire({ icon, title });

export const swalNotif = (title: string, text: string) =>
  Toast.fire({
    icon: "info",
    title,
    text,
    timer: 5000,
  });
