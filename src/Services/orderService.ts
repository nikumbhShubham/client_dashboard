import api from './api';

export interface Order {
    order_id: string;
    symbol: string;
    scripCode: string;
    qty: number;
    price: number;
    status: string;
    side: string;
    time: string;
    account: string;
    client_code: string;
    exchange: string;
    type: string;
    remote_id?: string;
}

export interface OrdersResponse {
    status: string;
    orders: Order[];
    total_orders: number;
    total_accounts: number;
}

export const orderService = {
    getRealtimeOrders: async (): Promise<OrdersResponse> => {
        try {
            const response = await api.get<OrdersResponse>('/realtime/orders');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch realtime orders:', error);
            return {
                status: 'Error',
                orders: [],
                total_orders: 0,
                total_accounts: 0
            };
        }
    }
};
