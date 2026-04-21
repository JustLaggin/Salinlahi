import { useParams } from "react-router-dom";
import AyudaDetailContent from "../components/AyudaDetailContent";
import { useAuth } from "../context/AuthContext";

export default function AdminAyudaDetail() {
  const { ayudaId } = useParams();
  const { isStaffOrAdmin } = useAuth();

  return (
    <AyudaDetailContent
      ayudaId={ayudaId}
      readOnly={!isStaffOrAdmin}
      embedded={false}
    />
  );
}
