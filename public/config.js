const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:3000/processos"
  : "https://processos-monitor-production.up.railway.app/processos";

export { API_URL };
