import { Routes, Route } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Home } from "./pages/Home";
import { Compass } from "./pages/Compass";
import { Lantern } from "./pages/Lantern";
import { FairyStones } from "./pages/FairyStones";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/compass" element={<Compass />} />
        <Route path="/lantern" element={<Lantern />} />
        <Route path="/fairy-stones" element={<FairyStones />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}
