export { EGYPT_GOVERNORATES } from '../../shared/GovernorateSelect';

export const DEFAULT_FORM_DATA = {
    shippingFlatRate: '50',
    freeShippingThreshold: '2000',
    vatEnabled: true,
    taxPercentage: '14',
    pricesIncludeTax: true,
    codEnabled: true,
    codAdvancePayment: '100',
    codReturnShippingBaseFee: '30',
    codReturnShippingBaseAmount: '1000',
    codReturnShippingExtraFee: '5',
    codReturnShippingExtraAmount: '1000',
    smtpPort: 587,
    cityShippingRates: [] as { city: string; rate: number }[],
};
