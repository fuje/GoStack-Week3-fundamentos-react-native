import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const PRODUCTS_KEY = 'PRODUCTS_STORAGE_KEY_3';

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(PRODUCTS_KEY);
      setProducts(storedProducts ? JSON.parse(storedProducts) : []);
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async (id: string) => {
      const idx = products.findIndex(p => p.id === id);

      if (idx > -1) {
        const updatedProduct: Product = {
          ...products[idx],
          quantity: products[idx].quantity + 1,
        };

        const updatedProducts = [...products];
        updatedProducts[idx] = updatedProduct;

        await AsyncStorage.setItem(
          PRODUCTS_KEY,
          JSON.stringify(updatedProducts),
        );

        setProducts(updatedProducts);
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const idx = products.findIndex(p => p.id === id);

      if (idx > -1) {
        const updatedProduct: Product = {
          ...products[idx],
          quantity: products[idx].quantity - 1,
        };

        let updatedProducts = [...products];
        updatedProducts[idx] = updatedProduct;
        updatedProducts = updatedProducts.filter(p => p.quantity > 0);

        await AsyncStorage.setItem(
          PRODUCTS_KEY,
          JSON.stringify(updatedProducts),
        );

        setProducts(updatedProducts);
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const idx = products.findIndex(p => p.id === product.id);

      if (idx > -1) {
        await increment(product.id);
      } else {
        const newProduct = { ...product, quantity: 1 };

        await AsyncStorage.setItem(
          PRODUCTS_KEY,
          JSON.stringify([...products, newProduct]),
        );

        setProducts(prevProducts => [...prevProducts, newProduct]);
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
