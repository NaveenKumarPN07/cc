import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return (
    <div className="container-page py-20 text-center animate-fade-in">
      <p className="font-display text-9xl font-extrabold text-gray-100 leading-none">404</p>
      <h1 className="font-display text-3xl font-bold text-dark mb-3 -mt-4">Page Not Found</h1>
      <p className="text-muted mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary">← Go Home</Link>
    </div>
  );
}
