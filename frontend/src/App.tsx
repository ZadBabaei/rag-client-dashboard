import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ChatPage from "./pages/ChatPage";
import ClientsPage from "./pages/ClientsPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import DocumentsPage from "./pages/DocumentsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ChatPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
      </Route>
    </Routes>
  );
}
