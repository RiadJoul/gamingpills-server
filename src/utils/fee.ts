import { PLATFROM_FEE } from "../constants";

export function calculateProfit(bet: number) {
    //our platform fee **Percentage**
    return bet * 2 - (PLATFROM_FEE * (bet * 2)) / 100;
}