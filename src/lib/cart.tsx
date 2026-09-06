import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import type { Product } from '@/lib/types';

export type CartLine = { product: Product; qty: number };

type CartValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  qtyOf: (productId: number) => number;
  addQty: (product: Product, qty: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

/** In-memory cart. Proof of concept — no persistence, no checkout. */
export function CartProvider({ children }: PropsWithChildren) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addQty = useCallback((product: Product, qty: number) => {
    if (qty <= 0) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, qty: l.qty + qty } : l,
        );
      }
      return [...prev, { product, qty }];
    });
  }, []);

  const setQty = useCallback((productId: number, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.product.id !== productId)
        : prev.map((l) => (l.product.id === productId ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((productId: number) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(() => {
    const priceOf = (p: Product) =>
      p.is_on_sale && p.sale_price != null ? p.sale_price : p.price;
    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((s, l) => s + l.qty * priceOf(l.product), 0),
      qtyOf: (id) => lines.find((l) => l.product.id === id)?.qty ?? 0,
      addQty,
      setQty,
      remove,
      clear,
    };
  }, [lines, addQty, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
