import { useParams } from "react-router-dom";
import AyudaDetailContent from "../components/AyudaDetailContent";
import { useAuth } from "../context/AuthContext";

export default function AdminAyudaDetail() {
  const { ayudaId } = useParams();
  const { isAdmin } = useAuth();

  return (
    <AyudaDetailContent ayudaId={ayudaId} readOnly={!isAdmin} embedded={false} />
  );
}
