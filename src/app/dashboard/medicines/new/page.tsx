"use client";

import { useRouter } from "next/navigation";
import { MedicineFormModal } from "../Medicineformmodal";

export default function NewMedicinePage() {
  const router = useRouter();

  return (
    <MedicineFormModal
      isOpen={true}
      onClose={() => router.push("/dashboard/medicines")}
      onSuccess={() => router.push("/dashboard/medicines")}
      initialData={null}
    />
  );
}