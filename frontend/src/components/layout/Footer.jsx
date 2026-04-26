import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dark text-gray-300 mt-16">
      <div className="container-page py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/">
              <span className="font-display text-3xl font-extrabold text-brand-400">AJIO</span>
              <span className="font-display text-3xl font-extrabold text-white">.clone</span>
            </Link>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              Your one-stop destination for fashion, footwear, and lifestyle products.
            </p>
            <div className="flex gap-3 mt-5">
              {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center 
                                               justify-center hover:bg-brand-500 transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-white mb-4">Shop</h3>
            <ul className="space-y-2.5">
              {['Men', 'Women', 'Kids', 'Footwear', 'Accessories', 'Sports'].map((c) => (
                <li key={c}>
                  <Link to={`/products?category=${c}`}
                    className="text-sm hover:text-white transition-colors">{c}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-semibold text-white mb-4">Help</h3>
            <ul className="space-y-2.5 text-sm">
              {['FAQs', 'Track Order', 'Return Policy', 'Shipping Policy', 'Contact Us'].map((item) => (
                <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2.5 text-sm">
              {['About Us', 'Careers', 'Press', 'Blog', 'Privacy Policy', 'Terms of Use'].map((item) => (
                <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="container-page py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} AJIO Clone. Built with ❤️ using MERN Stack.</p>
          <p>100% Secure Payments · Free Returns · 24/7 Support</p>
        </div>
      </div>
    </footer>
  );
}
