import { Link, Route, Routes } from 'react-router-dom';
import { apiClient } from '../shared/api/apiClient';

function Home() {
  return <section><h2>Application Platform</h2><p>FiinGroupApp đang được xây dựng theo AI-DLC.</p><button onClick={() => apiClient.get('/health').then(console.log).catch(console.error)}>Kiểm tra API</button></section>;
}

export default function App() {
  return <div className="app-shell"><header><h1>FiinGroupApp</h1><nav><Link to="/">Trang chủ</Link></nav></header><main><Routes><Route path="*" element={<Home />} /></Routes></main></div>;
}
