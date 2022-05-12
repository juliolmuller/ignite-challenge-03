import { createContext, ReactNode, useContext } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';
import { useStorage } from './useStorage';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const STORAGE_CART_KEY = '@RocketShoes:cart';

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useStorage<Product[]>(STORAGE_CART_KEY, []);

  const addProduct = async (productId: number) => {
    try {
      let productData: Product;
      let productStock: Stock;

      try {
        const productsResponse = await api.get<Product>(`/products/${productId}`);
        const stockResponse = await api.get<Stock>(`/stock/${productId}`);
        productData = productsResponse.data;
        productStock = stockResponse.data;
      } catch {
        throw new Error('Erro na adição do produto');
      }

      const product = cart.find((product) => product.id === productId);

      if (productStock.amount <=  (product?.amount ?? 0)) {
        throw new Error('Quantidade solicitada fora de estoque');
      }

      product
        ? setCart(cart.map((product) => product.id === productId
          ? { ...productData, amount: product.amount + 1 }
          : product))
        : setCart([...cart, { ...productData, amount: 1 }]);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productToRemove = cart.find((product) => product.id === productId);

      if (!productToRemove)
        throw new Error('Erro na remoção do produto');

      setCart(cart.filter((product) => product !== productToRemove));
    } catch (error: any) {
      toast.error(error.message);
    }
  };


  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0)
        throw new Error('Quantidade solicitada fora de estoque');

      const product = cart.find((product) => product.id === productId);

      if (!product)
        throw new Error('Erro na alteração de quantidade do produto');

      const { data: productStock } = await api.get<Stock>(
        `/stock/${productId}`,
      );

      if (productStock.amount < amount)
        throw new Error('Quantidade solicitada fora de estoque');

      const newCart = cart.map((product) => {
        if (product.id === productId) product.amount = amount;
        return product;
      });
      setCart(newCart);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
