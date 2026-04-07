import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ items, lang }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-slate-600 mb-6">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="w-4 h-4" />}
          {item.href ? (
            <Link to={item.href} className="hover:text-[#1e3a5f] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}