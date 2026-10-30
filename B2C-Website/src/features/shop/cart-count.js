export const cartItemCount = (items) => items.reduce((total, item) => total + item.quantity, 0)
