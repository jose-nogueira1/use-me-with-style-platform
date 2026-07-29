import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { C, F, t, pickBilingual, formatKz, type Lang } from '../../theme';
import { useApp } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import {
  createOrder,
  createAppyPayOrder,
  createStripeCheckoutSession,
  fetchMarketSettings,
  validateCoupon,
  type CreateOrderInput,
  type MarketSettings,
} from '../../lib/api';
import { isAppyPayWidgetConfigured } from '../../config/env';
import { AppyPayWidget } from '../components/AppyPayWidget';
import { getMetaOrderContext } from '../../lib/analyticsConsent';
import { PaypalButton } from '../components/PaypalButton';
import { localizeCouponError } from '../couponError';
import { checkoutShippingCost, LUANDA_MUNICIPALITIES, normalizeAngolaShipping, normalizePortugalShipping } from '../shipping';

// Angola delivery is local courier only and payment is Multicaixa Express
// through AppyPay. Portugal retains its separate online-payment methods.

const DEFAULT_MARKET_SETTINGS: MarketSettings = {
  angolaPaymentLive: false,
  // Bilingual fallback (2026-07-26 bilingual audit fix): this used to be a
  // single English-only string, so Angola's Portuguese-default shoppers saw
  // English bank-transfer instructions whenever the CMS field was blank.
  angolaBankTransferInstructionsPT:
    'As instruções de pagamento Multicaixa Express são enviadas por WhatsApp assim que a encomenda for confirmada.',
  angolaBankTransferInstructionsEN:
    'Multicaixa Express payment instructions are sent by WhatsApp once the order is confirmed.',
  angolaPaymentMethods: ['multicaixa_express'],
  angolaDeliveryMethods: ['courier_ao'],
  angolaMunicipalityPrices: {
    Luanda: 3000, Cacuaco: 5000, Cazenga: 3500, Viana: 6000, Belas: 6500, Talatona: 4000,
    Mussulo: 8000, Sambizanga: 3000, Rangel: 3000, Maianga: 2500, Samba: 3500, Camama: 4500,
    Mulenvos: 5500, Kilamba: 5000, 'Hoji Ya Henda': 3500, Ingombota: 2500,
  },
  angolaFreeShippingThreshold: 80000,
  portugalPaymentMethods: ['paypal', 'stripe', 'mbway'],
  portugalDeliveryMethods: ['ctt', 'courier_pt'],
  portugalStandardShippingPrice: 4.9,
  portugalTrackedShippingPrice: 6.9,
  portugalFreeShippingThreshold: 75,
  angolaReturnsPolicyTextPT: '',
  angolaReturnsPolicyTextEN: '',
  portugalReturnsPolicyTextPT: '',
  portugalReturnsPolicyTextEN: '',
  businessHoursTextPT: '',
  businessHoursTextEN: '',
  angolaShippingTextPT: '',
  angolaShippingTextEN: '',
  portugalShippingTextPT: '',
  portugalShippingTextEN: '',
  internationalShippingTextPT: '',
  internationalShippingTextEN: '',
};

const PAYMENT_LABEL_KEYS: Record<string, string> = {
  paypal: 'paymentPaypal',
  stripe: 'paymentStripe',
  mbway: 'paymentMbway',
  multicaixa_express: 'paymentMulticaixaExpress',
};

const DELIVERY_LABEL_KEYS: Record<string, string> = {
  ctt: 'deliveryCtt',
  courier_pt: 'deliveryCourier',
  courier_ao: 'deliveryCourierAo',
};

// Phone country-code dropdown (added 2026-07-24, user request; expanded to
// all countries the same day per follow-up feedback -- the first pass only
// had ~15 curated entries). Data generated from the `country-telephone-data`
// npm package (dial codes/ISO2, the same dataset react-phone-input-2 uses)
// merged with `world-countries` for Portuguese country names, since the
// storefront needs both languages -- see the generation script referenced
// in the PR description if this ever needs regenerating.
//
// Selection is keyed by iso2, NOT by dial code: several countries share a
// code (Canada/US/Dominican Republic/Puerto Rico/US Minor Outlying Islands
// are all +1). A <select> is controlled by matching an option's `value` --
// if two options shared the literal "+1" value, picking the second one
// would visually snap back to whichever "+1" option comes first in the
// list, because the DOM resolves a value to the first matching option
// regardless of which one the user actually clicked. iso2 has no
// duplicates, so this can't happen.
const ALL_COUNTRY_CODES = [
  { code: '+93', iso2: 'AF', nameEN: 'Afghanistan', namePT: 'Afeganistão' },
  { code: '+358', iso2: 'AX', nameEN: 'Åland Islands', namePT: 'Alândia' },
  { code: '+355', iso2: 'AL', nameEN: 'Albania', namePT: 'Albânia' },
  { code: '+213', iso2: 'DZ', nameEN: 'Algeria', namePT: 'Argélia' },
  { code: '+1684', iso2: 'AS', nameEN: 'American Samoa', namePT: 'Samoa Americana' },
  { code: '+376', iso2: 'AD', nameEN: 'Andorra', namePT: 'Andorra' },
  { code: '+244', iso2: 'AO', nameEN: 'Angola', namePT: 'Angola' },
  { code: '+1264', iso2: 'AI', nameEN: 'Anguilla', namePT: 'Anguilla' },
  { code: '+672', iso2: 'AQ', nameEN: 'Antarctica', namePT: 'Antártida' },
  { code: '+1268', iso2: 'AG', nameEN: 'Antigua and Barbuda', namePT: 'Antígua e Barbuda' },
  { code: '+54', iso2: 'AR', nameEN: 'Argentina', namePT: 'Argentina' },
  { code: '+374', iso2: 'AM', nameEN: 'Armenia', namePT: 'Arménia' },
  { code: '+297', iso2: 'AW', nameEN: 'Aruba', namePT: 'Aruba' },
  { code: '+61', iso2: 'AU', nameEN: 'Australia', namePT: 'Austrália' },
  { code: '+43', iso2: 'AT', nameEN: 'Austria', namePT: 'Áustria' },
  { code: '+994', iso2: 'AZ', nameEN: 'Azerbaijan', namePT: 'Azerbeijão' },
  { code: '+1242', iso2: 'BS', nameEN: 'Bahamas', namePT: 'Bahamas' },
  { code: '+973', iso2: 'BH', nameEN: 'Bahrain', namePT: 'Bahrein' },
  { code: '+880', iso2: 'BD', nameEN: 'Bangladesh', namePT: 'Bangladesh' },
  { code: '+1246', iso2: 'BB', nameEN: 'Barbados', namePT: 'Barbados' },
  { code: '+375', iso2: 'BY', nameEN: 'Belarus', namePT: 'Bielorússia' },
  { code: '+32', iso2: 'BE', nameEN: 'Belgium', namePT: 'Bélgica' },
  { code: '+501', iso2: 'BZ', nameEN: 'Belize', namePT: 'Belize' },
  { code: '+229', iso2: 'BJ', nameEN: 'Benin', namePT: 'Benin' },
  { code: '+1441', iso2: 'BM', nameEN: 'Bermuda', namePT: 'Bermudas' },
  { code: '+975', iso2: 'BT', nameEN: 'Bhutan', namePT: 'Butão' },
  { code: '+591', iso2: 'BO', nameEN: 'Bolivia', namePT: 'Bolívia' },
  { code: '+387', iso2: 'BA', nameEN: 'Bosnia and Herzegovina', namePT: 'Bósnia e Herzegovina' },
  { code: '+267', iso2: 'BW', nameEN: 'Botswana', namePT: 'Botswana' },
  { code: '+47', iso2: 'BV', nameEN: 'Bouvet Island', namePT: 'Ilha Bouvet' },
  { code: '+55', iso2: 'BR', nameEN: 'Brazil', namePT: 'Brasil' },
  { code: '+246', iso2: 'IO', nameEN: 'British Indian Ocean Territory', namePT: 'Território Britânico do Oceano Índico' },
  { code: '+1284', iso2: 'VG', nameEN: 'British Virgin Islands', namePT: 'Ilhas Virgens' },
  { code: '+673', iso2: 'BN', nameEN: 'Brunei', namePT: 'Brunei' },
  { code: '+359', iso2: 'BG', nameEN: 'Bulgaria', namePT: 'Bulgária' },
  { code: '+226', iso2: 'BF', nameEN: 'Burkina Faso', namePT: 'Burkina Faso' },
  { code: '+257', iso2: 'BI', nameEN: 'Burundi', namePT: 'Burundi' },
  { code: '+855', iso2: 'KH', nameEN: 'Cambodia', namePT: 'Camboja' },
  { code: '+237', iso2: 'CM', nameEN: 'Cameroon', namePT: 'Camarões' },
  { code: '+1', iso2: 'CA', nameEN: 'Canada', namePT: 'Canadá' },
  { code: '+238', iso2: 'CV', nameEN: 'Cape Verde', namePT: 'Cabo Verde' },
  { code: '+599', iso2: 'BQ', nameEN: 'Caribbean Netherlands', namePT: 'Países Baixos Caribenhos' },
  { code: '+1345', iso2: 'KY', nameEN: 'Cayman Islands', namePT: 'Ilhas Caimão' },
  { code: '+236', iso2: 'CF', nameEN: 'Central African Republic', namePT: 'República Centro-Africana' },
  { code: '+235', iso2: 'TD', nameEN: 'Chad', namePT: 'Chade' },
  { code: '+56', iso2: 'CL', nameEN: 'Chile', namePT: 'Chile' },
  { code: '+86', iso2: 'CN', nameEN: 'China', namePT: 'China' },
  { code: '+61', iso2: 'CX', nameEN: 'Christmas Island', namePT: 'Ilha do Natal' },
  { code: '+61', iso2: 'CC', nameEN: 'Cocos (Keeling) Islands', namePT: 'Ilhas Cocos (Keeling)' },
  { code: '+57', iso2: 'CO', nameEN: 'Colombia', namePT: 'Colômbia' },
  { code: '+269', iso2: 'KM', nameEN: 'Comoros', namePT: 'Comores' },
  { code: '+682', iso2: 'CK', nameEN: 'Cook Islands', namePT: 'Ilhas Cook' },
  { code: '+506', iso2: 'CR', nameEN: 'Costa Rica', namePT: 'Costa Rica' },
  { code: '+385', iso2: 'HR', nameEN: 'Croatia', namePT: 'Croácia' },
  { code: '+53', iso2: 'CU', nameEN: 'Cuba', namePT: 'Cuba' },
  { code: '+599', iso2: 'CW', nameEN: 'Curaçao', namePT: 'ilha da Curação' },
  { code: '+357', iso2: 'CY', nameEN: 'Cyprus', namePT: 'Chipre' },
  { code: '+420', iso2: 'CZ', nameEN: 'Czechia', namePT: 'Chéquia' },
  { code: '+45', iso2: 'DK', nameEN: 'Denmark', namePT: 'Dinamarca' },
  { code: '+253', iso2: 'DJ', nameEN: 'Djibouti', namePT: 'Djibouti' },
  { code: '+1767', iso2: 'DM', nameEN: 'Dominica', namePT: 'Dominica' },
  { code: '+1', iso2: 'DO', nameEN: 'Dominican Republic', namePT: 'República Dominicana' },
  { code: '+243', iso2: 'CD', nameEN: 'DR Congo', namePT: 'República Democrática do Congo' },
  { code: '+593', iso2: 'EC', nameEN: 'Ecuador', namePT: 'Equador' },
  { code: '+20', iso2: 'EG', nameEN: 'Egypt', namePT: 'Egito' },
  { code: '+503', iso2: 'SV', nameEN: 'El Salvador', namePT: 'El Salvador' },
  { code: '+240', iso2: 'GQ', nameEN: 'Equatorial Guinea', namePT: 'Guiné Equatorial' },
  { code: '+291', iso2: 'ER', nameEN: 'Eritrea', namePT: 'Eritreia' },
  { code: '+372', iso2: 'EE', nameEN: 'Estonia', namePT: 'Estónia' },
  { code: '+268', iso2: 'SZ', nameEN: 'Eswatini', namePT: 'Suazilândia' },
  { code: '+251', iso2: 'ET', nameEN: 'Ethiopia', namePT: 'Etiópia' },
  { code: '+500', iso2: 'FK', nameEN: 'Falkland Islands', namePT: 'Ilhas Malvinas' },
  { code: '+298', iso2: 'FO', nameEN: 'Faroe Islands', namePT: 'Ilhas Faroé' },
  { code: '+679', iso2: 'FJ', nameEN: 'Fiji', namePT: 'Fiji' },
  { code: '+358', iso2: 'FI', nameEN: 'Finland', namePT: 'Finlândia' },
  { code: '+33', iso2: 'FR', nameEN: 'France', namePT: 'França' },
  { code: '+594', iso2: 'GF', nameEN: 'French Guiana', namePT: 'Guiana Francesa' },
  { code: '+689', iso2: 'PF', nameEN: 'French Polynesia', namePT: 'Polinésia Francesa' },
  { code: '+262', iso2: 'TF', nameEN: 'French Southern and Antarctic Lands', namePT: 'Terras Austrais e Antárticas Francesas' },
  { code: '+241', iso2: 'GA', nameEN: 'Gabon', namePT: 'Gabão' },
  { code: '+220', iso2: 'GM', nameEN: 'Gambia', namePT: 'Gâmbia' },
  { code: '+995', iso2: 'GE', nameEN: 'Georgia', namePT: 'Geórgia' },
  { code: '+49', iso2: 'DE', nameEN: 'Germany', namePT: 'Alemanha' },
  { code: '+233', iso2: 'GH', nameEN: 'Ghana', namePT: 'Gana' },
  { code: '+350', iso2: 'GI', nameEN: 'Gibraltar', namePT: 'Gibraltar' },
  { code: '+30', iso2: 'GR', nameEN: 'Greece', namePT: 'Grécia' },
  { code: '+299', iso2: 'GL', nameEN: 'Greenland', namePT: 'Gronelândia' },
  { code: '+1473', iso2: 'GD', nameEN: 'Grenada', namePT: 'Granada' },
  { code: '+590', iso2: 'GP', nameEN: 'Guadeloupe', namePT: 'Guadalupe' },
  { code: '+1671', iso2: 'GU', nameEN: 'Guam', namePT: 'Guam' },
  { code: '+502', iso2: 'GT', nameEN: 'Guatemala', namePT: 'Guatemala' },
  { code: '+44', iso2: 'GG', nameEN: 'Guernsey', namePT: 'Guernsey' },
  { code: '+224', iso2: 'GN', nameEN: 'Guinea', namePT: 'Guiné' },
  { code: '+245', iso2: 'GW', nameEN: 'Guinea-Bissau', namePT: 'Guiné-Bissau' },
  { code: '+592', iso2: 'GY', nameEN: 'Guyana', namePT: 'Guiana' },
  { code: '+509', iso2: 'HT', nameEN: 'Haiti', namePT: 'Haiti' },
  { code: '+672', iso2: 'HM', nameEN: 'Heard Island and McDonald Islands', namePT: 'Ilha Heard e Ilhas McDonald' },
  { code: '+504', iso2: 'HN', nameEN: 'Honduras', namePT: 'Honduras' },
  { code: '+852', iso2: 'HK', nameEN: 'Hong Kong', namePT: 'Hong Kong' },
  { code: '+36', iso2: 'HU', nameEN: 'Hungary', namePT: 'Hungria' },
  { code: '+354', iso2: 'IS', nameEN: 'Iceland', namePT: 'Islândia' },
  { code: '+91', iso2: 'IN', nameEN: 'India', namePT: 'Índia' },
  { code: '+62', iso2: 'ID', nameEN: 'Indonesia', namePT: 'Indonésia' },
  { code: '+98', iso2: 'IR', nameEN: 'Iran', namePT: 'Irão' },
  { code: '+964', iso2: 'IQ', nameEN: 'Iraq', namePT: 'Iraque' },
  { code: '+353', iso2: 'IE', nameEN: 'Ireland', namePT: 'Irlanda' },
  { code: '+44', iso2: 'IM', nameEN: 'Isle of Man', namePT: 'Ilha de Man' },
  { code: '+972', iso2: 'IL', nameEN: 'Israel', namePT: 'Israel' },
  { code: '+39', iso2: 'IT', nameEN: 'Italy', namePT: 'Itália' },
  { code: '+225', iso2: 'CI', nameEN: 'Ivory Coast', namePT: 'Costa do Marfim' },
  { code: '+1876', iso2: 'JM', nameEN: 'Jamaica', namePT: 'Jamaica' },
  { code: '+81', iso2: 'JP', nameEN: 'Japan', namePT: 'Japão' },
  { code: '+44', iso2: 'JE', nameEN: 'Jersey', namePT: 'Jersey' },
  { code: '+962', iso2: 'JO', nameEN: 'Jordan', namePT: 'Jordânia' },
  { code: '+7', iso2: 'KZ', nameEN: 'Kazakhstan', namePT: 'Cazaquistão' },
  { code: '+254', iso2: 'KE', nameEN: 'Kenya', namePT: 'Quénia' },
  { code: '+686', iso2: 'KI', nameEN: 'Kiribati', namePT: 'Kiribati' },
  { code: '+383', iso2: 'XK', nameEN: 'Kosovo', namePT: 'Kosovo' },
  { code: '+965', iso2: 'KW', nameEN: 'Kuwait', namePT: 'Kuwait' },
  { code: '+996', iso2: 'KG', nameEN: 'Kyrgyzstan', namePT: 'Quirguistão' },
  { code: '+856', iso2: 'LA', nameEN: 'Laos', namePT: 'Laos' },
  { code: '+371', iso2: 'LV', nameEN: 'Latvia', namePT: 'Letónia' },
  { code: '+961', iso2: 'LB', nameEN: 'Lebanon', namePT: 'Líbano' },
  { code: '+266', iso2: 'LS', nameEN: 'Lesotho', namePT: 'Lesoto' },
  { code: '+231', iso2: 'LR', nameEN: 'Liberia', namePT: 'Libéria' },
  { code: '+218', iso2: 'LY', nameEN: 'Libya', namePT: 'Líbia' },
  { code: '+423', iso2: 'LI', nameEN: 'Liechtenstein', namePT: 'Liechtenstein' },
  { code: '+370', iso2: 'LT', nameEN: 'Lithuania', namePT: 'Lituânia' },
  { code: '+352', iso2: 'LU', nameEN: 'Luxembourg', namePT: 'Luxemburgo' },
  { code: '+853', iso2: 'MO', nameEN: 'Macau', namePT: 'Macau' },
  { code: '+261', iso2: 'MG', nameEN: 'Madagascar', namePT: 'Madagáscar' },
  { code: '+265', iso2: 'MW', nameEN: 'Malawi', namePT: 'Malawi' },
  { code: '+60', iso2: 'MY', nameEN: 'Malaysia', namePT: 'Malásia' },
  { code: '+960', iso2: 'MV', nameEN: 'Maldives', namePT: 'Maldivas' },
  { code: '+223', iso2: 'ML', nameEN: 'Mali', namePT: 'Mali' },
  { code: '+356', iso2: 'MT', nameEN: 'Malta', namePT: 'Malta' },
  { code: '+692', iso2: 'MH', nameEN: 'Marshall Islands', namePT: 'Ilhas Marshall' },
  { code: '+596', iso2: 'MQ', nameEN: 'Martinique', namePT: 'Martinica' },
  { code: '+222', iso2: 'MR', nameEN: 'Mauritania', namePT: 'Mauritânia' },
  { code: '+230', iso2: 'MU', nameEN: 'Mauritius', namePT: 'Maurício' },
  { code: '+262', iso2: 'YT', nameEN: 'Mayotte', namePT: 'Mayotte' },
  { code: '+52', iso2: 'MX', nameEN: 'Mexico', namePT: 'México' },
  { code: '+691', iso2: 'FM', nameEN: 'Micronesia', namePT: 'Micronésia' },
  { code: '+373', iso2: 'MD', nameEN: 'Moldova', namePT: 'Moldávia' },
  { code: '+377', iso2: 'MC', nameEN: 'Monaco', namePT: 'Mónaco' },
  { code: '+976', iso2: 'MN', nameEN: 'Mongolia', namePT: 'Mongólia' },
  { code: '+382', iso2: 'ME', nameEN: 'Montenegro', namePT: 'Montenegro' },
  { code: '+1664', iso2: 'MS', nameEN: 'Montserrat', namePT: 'Montserrat' },
  { code: '+212', iso2: 'MA', nameEN: 'Morocco', namePT: 'Marrocos' },
  { code: '+258', iso2: 'MZ', nameEN: 'Mozambique', namePT: 'Moçambique' },
  { code: '+95', iso2: 'MM', nameEN: 'Myanmar', namePT: 'Myanmar' },
  { code: '+264', iso2: 'NA', nameEN: 'Namibia', namePT: 'Namíbia' },
  { code: '+674', iso2: 'NR', nameEN: 'Nauru', namePT: 'Nauru' },
  { code: '+977', iso2: 'NP', nameEN: 'Nepal', namePT: 'Nepal' },
  { code: '+31', iso2: 'NL', nameEN: 'Netherlands', namePT: 'Holanda' },
  { code: '+687', iso2: 'NC', nameEN: 'New Caledonia', namePT: 'Nova Caledónia' },
  { code: '+64', iso2: 'NZ', nameEN: 'New Zealand', namePT: 'Nova Zelândia' },
  { code: '+505', iso2: 'NI', nameEN: 'Nicaragua', namePT: 'Nicarágua' },
  { code: '+227', iso2: 'NE', nameEN: 'Niger', namePT: 'Níger' },
  { code: '+234', iso2: 'NG', nameEN: 'Nigeria', namePT: 'Nigéria' },
  { code: '+683', iso2: 'NU', nameEN: 'Niue', namePT: 'Niue' },
  { code: '+672', iso2: 'NF', nameEN: 'Norfolk Island', namePT: 'Ilha Norfolk' },
  { code: '+850', iso2: 'KP', nameEN: 'North Korea', namePT: 'Coreia do Norte' },
  { code: '+389', iso2: 'MK', nameEN: 'North Macedonia', namePT: 'Macedónia do Norte' },
  { code: '+1670', iso2: 'MP', nameEN: 'Northern Mariana Islands', namePT: 'Marianas Setentrionais' },
  { code: '+47', iso2: 'NO', nameEN: 'Norway', namePT: 'Noruega' },
  { code: '+968', iso2: 'OM', nameEN: 'Oman', namePT: 'Omã' },
  { code: '+92', iso2: 'PK', nameEN: 'Pakistan', namePT: 'Paquistão' },
  { code: '+680', iso2: 'PW', nameEN: 'Palau', namePT: 'Palau' },
  { code: '+970', iso2: 'PS', nameEN: 'Palestine', namePT: 'Palestina' },
  { code: '+507', iso2: 'PA', nameEN: 'Panama', namePT: 'Panamá' },
  { code: '+675', iso2: 'PG', nameEN: 'Papua New Guinea', namePT: 'Papua Nova Guiné' },
  { code: '+595', iso2: 'PY', nameEN: 'Paraguay', namePT: 'Paraguai' },
  { code: '+51', iso2: 'PE', nameEN: 'Peru', namePT: 'Perú' },
  { code: '+63', iso2: 'PH', nameEN: 'Philippines', namePT: 'Filipinas' },
  { code: '+64', iso2: 'PN', nameEN: 'Pitcairn Islands', namePT: 'Ilhas Pitcairn' },
  { code: '+48', iso2: 'PL', nameEN: 'Poland', namePT: 'Polónia' },
  { code: '+351', iso2: 'PT', nameEN: 'Portugal', namePT: 'Portugal' },
  { code: '+1', iso2: 'PR', nameEN: 'Puerto Rico', namePT: 'Porto Rico' },
  { code: '+974', iso2: 'QA', nameEN: 'Qatar', namePT: 'Catar' },
  { code: '+242', iso2: 'CG', nameEN: 'Republic of the Congo', namePT: 'Congo' },
  { code: '+262', iso2: 'RE', nameEN: 'Réunion', namePT: 'Reunião' },
  { code: '+40', iso2: 'RO', nameEN: 'Romania', namePT: 'Roménia' },
  { code: '+7', iso2: 'RU', nameEN: 'Russia', namePT: 'Rússia' },
  { code: '+250', iso2: 'RW', nameEN: 'Rwanda', namePT: 'Ruanda' },
  { code: '+590', iso2: 'BL', nameEN: 'Saint Barthélemy', namePT: 'São Bartolomeu' },
  { code: '+290', iso2: 'SH', nameEN: 'Saint Helena, Ascension and Tristan da Cunha', namePT: 'Santa Helena, Ascensão e Tristão da Cunha' },
  { code: '+1869', iso2: 'KN', nameEN: 'Saint Kitts and Nevis', namePT: 'São Cristóvão e Nevis' },
  { code: '+1758', iso2: 'LC', nameEN: 'Saint Lucia', namePT: 'Santa Lúcia' },
  { code: '+590', iso2: 'MF', nameEN: 'Saint Martin', namePT: 'São Martinho' },
  { code: '+508', iso2: 'PM', nameEN: 'Saint Pierre and Miquelon', namePT: 'Saint-Pierre e Miquelon' },
  { code: '+1784', iso2: 'VC', nameEN: 'Saint Vincent and the Grenadines', namePT: 'São Vincente e Granadinas' },
  { code: '+685', iso2: 'WS', nameEN: 'Samoa', namePT: 'Samoa' },
  { code: '+378', iso2: 'SM', nameEN: 'San Marino', namePT: 'San Marino' },
  { code: '+239', iso2: 'ST', nameEN: 'São Tomé and Príncipe', namePT: 'São Tomé e Príncipe' },
  { code: '+966', iso2: 'SA', nameEN: 'Saudi Arabia', namePT: 'Arábia Saudita' },
  { code: '+221', iso2: 'SN', nameEN: 'Senegal', namePT: 'Senegal' },
  { code: '+381', iso2: 'RS', nameEN: 'Serbia', namePT: 'Sérvia' },
  { code: '+248', iso2: 'SC', nameEN: 'Seychelles', namePT: 'Seicheles' },
  { code: '+232', iso2: 'SL', nameEN: 'Sierra Leone', namePT: 'Serra Leoa' },
  { code: '+65', iso2: 'SG', nameEN: 'Singapore', namePT: 'Singapura' },
  { code: '+1721', iso2: 'SX', nameEN: 'Sint Maarten', namePT: 'São Martinho' },
  { code: '+421', iso2: 'SK', nameEN: 'Slovakia', namePT: 'Eslováquia' },
  { code: '+386', iso2: 'SI', nameEN: 'Slovenia', namePT: 'Eslovénia' },
  { code: '+677', iso2: 'SB', nameEN: 'Solomon Islands', namePT: 'Ilhas Salomão' },
  { code: '+252', iso2: 'SO', nameEN: 'Somalia', namePT: 'Somália' },
  { code: '+27', iso2: 'ZA', nameEN: 'South Africa', namePT: 'África do Sul' },
  { code: '+500', iso2: 'GS', nameEN: 'South Georgia', namePT: 'Ilhas Geórgia do Sul e Sandwich do Sul' },
  { code: '+82', iso2: 'KR', nameEN: 'South Korea', namePT: 'Coreia do Sul' },
  { code: '+211', iso2: 'SS', nameEN: 'South Sudan', namePT: 'Sudão do Sul' },
  { code: '+34', iso2: 'ES', nameEN: 'Spain', namePT: 'Espanha' },
  { code: '+94', iso2: 'LK', nameEN: 'Sri Lanka', namePT: 'Sri Lanka' },
  { code: '+249', iso2: 'SD', nameEN: 'Sudan', namePT: 'Sudão' },
  { code: '+597', iso2: 'SR', nameEN: 'Suriname', namePT: 'Suriname' },
  { code: '+47', iso2: 'SJ', nameEN: 'Svalbard and Jan Mayen', namePT: 'Ilhas Svalbard e Jan Mayen' },
  { code: '+46', iso2: 'SE', nameEN: 'Sweden', namePT: 'Suécia' },
  { code: '+41', iso2: 'CH', nameEN: 'Switzerland', namePT: 'Suíça' },
  { code: '+963', iso2: 'SY', nameEN: 'Syria', namePT: 'Síria' },
  { code: '+886', iso2: 'TW', nameEN: 'Taiwan', namePT: 'Ilha Formosa' },
  { code: '+992', iso2: 'TJ', nameEN: 'Tajikistan', namePT: 'Tajiquistão' },
  { code: '+255', iso2: 'TZ', nameEN: 'Tanzania', namePT: 'Tanzânia' },
  { code: '+66', iso2: 'TH', nameEN: 'Thailand', namePT: 'Tailândia' },
  { code: '+670', iso2: 'TL', nameEN: 'Timor-Leste', namePT: 'Timor-Leste' },
  { code: '+228', iso2: 'TG', nameEN: 'Togo', namePT: 'Togo' },
  { code: '+690', iso2: 'TK', nameEN: 'Tokelau', namePT: 'Tokelau' },
  { code: '+676', iso2: 'TO', nameEN: 'Tonga', namePT: 'Tonga' },
  { code: '+1868', iso2: 'TT', nameEN: 'Trinidad and Tobago', namePT: 'Trinidade e Tobago' },
  { code: '+216', iso2: 'TN', nameEN: 'Tunisia', namePT: 'Tunísia' },
  { code: '+90', iso2: 'TR', nameEN: 'Türkiye', namePT: 'Turquia' },
  { code: '+993', iso2: 'TM', nameEN: 'Turkmenistan', namePT: 'Turquemenistão' },
  { code: '+1649', iso2: 'TC', nameEN: 'Turks and Caicos Islands', namePT: 'Ilhas Turks e Caicos' },
  { code: '+688', iso2: 'TV', nameEN: 'Tuvalu', namePT: 'Tuvalu' },
  { code: '+256', iso2: 'UG', nameEN: 'Uganda', namePT: 'Uganda' },
  { code: '+380', iso2: 'UA', nameEN: 'Ukraine', namePT: 'Ucrânia' },
  { code: '+971', iso2: 'AE', nameEN: 'United Arab Emirates', namePT: 'Emirados Árabes Unidos' },
  { code: '+44', iso2: 'GB', nameEN: 'United Kingdom', namePT: 'Reino Unido' },
  { code: '+1', iso2: 'US', nameEN: 'United States', namePT: 'Estados Unidos' },
  { code: '+1', iso2: 'UM', nameEN: 'United States Minor Outlying Islands', namePT: 'Ilhas Menores Distantes dos Estados Unidos' },
  { code: '+1340', iso2: 'VI', nameEN: 'United States Virgin Islands', namePT: 'Ilhas Virgens dos Estados Unidos' },
  { code: '+598', iso2: 'UY', nameEN: 'Uruguay', namePT: 'Uruguai' },
  { code: '+998', iso2: 'UZ', nameEN: 'Uzbekistan', namePT: 'Uzbequistão' },
  { code: '+678', iso2: 'VU', nameEN: 'Vanuatu', namePT: 'Vanuatu' },
  { code: '+39', iso2: 'VA', nameEN: 'Vatican City', namePT: 'Cidade do Vaticano' },
  { code: '+58', iso2: 'VE', nameEN: 'Venezuela', namePT: 'Venezuela' },
  { code: '+84', iso2: 'VN', nameEN: 'Vietnam', namePT: 'Vietname' },
  { code: '+681', iso2: 'WF', nameEN: 'Wallis and Futuna', namePT: 'Wallis e Futuna' },
  { code: '+212', iso2: 'EH', nameEN: 'Western Sahara', namePT: 'Saara Ocidental' },
  { code: '+967', iso2: 'YE', nameEN: 'Yemen', namePT: 'Iémen' },
  { code: '+260', iso2: 'ZM', nameEN: 'Zambia', namePT: 'Zâmbia' },
  { code: '+263', iso2: 'ZW', nameEN: 'Zimbabwe', namePT: 'Zimbabwe' },
] as const;

// Regional-indicator flag emoji from an ISO 3166-1 alpha-2 code -- computed
// rather than stored per-entry above, so the 250-country list stays one
// line per country.
function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

// Portugal and Angola pinned first (the two markets this storefront
// serves), then the rest alphabetically by name in whichever language is
// currently selected.
function countryCodeOptionsFor(lang: Lang) {
  const pinnedIso2 = ['PT', 'AO'];
  const pinned = pinnedIso2
    .map((iso2) => ALL_COUNTRY_CODES.find((c) => c.iso2 === iso2))
    .filter((c): c is (typeof ALL_COUNTRY_CODES)[number] => Boolean(c));
  const rest = ALL_COUNTRY_CODES.filter((c) => !pinnedIso2.includes(c.iso2)).slice();
  rest.sort((a, b) => {
    const nameA = lang === 'pt' ? a.namePT : a.nameEN;
    const nameB = lang === 'pt' ? b.namePT : b.nameEN;
    return nameA.localeCompare(nameB, lang);
  });
  return [...pinned, ...rest];
}

// Payload's Postgres relationship IDs are numbers. Product models keep IDs
// as strings so the UI also supports UUID/string-backed installations, but
// payment endpoints use Payload's Local API and therefore need numeric IDs
// restored before the order payload is sent.
const cmsRelationshipId = (id: string): string | number =>
  /^\d+$/.test(id) ? Number(id) : id;

export function Checkout() {
  const { market, lang, cart } = useApp();
  const { products } = useProducts(market, lang);
  const navigate = useNavigate();

  const [settings, setSettings] = useState<MarketSettings>(DEFAULT_MARKET_SETTINGS);
  const [submitting, setSubmitting] = useState(false);
  const [appyPayOrder, setAppyPayOrder] = useState<{
    orderNumber: string;
    merchantTransactionId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('stripe') === 'cancelled' ? t('paymentCancelled', lang) : null;
  });
  const errorRef = useRef<HTMLDivElement>(null);

  // Coupon codes (2026-07-25, discounts phase 2). Advisory-only client-side
  // check via validateCoupon() -- the CMS re-resolves the same code for
  // real at order-creation time (authoritativeOrder.ts) and rejects the
  // order if it's no longer valid by then, so this being stale is harmless.
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; label: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const [form, setForm] = useState({
    name: '',
    phoneCountryIso2: market === 'AO' ? 'AO' : 'PT',
    phone: '',
    email: '',
    address: '',
    addressLine2: '',
    postalCode: '',
    city: '',
    country: market === 'AO' ? 'Angola' : 'Portugal',
    taxId: '',
    notes: '',
  });

  // PT CTT postal codes are always 0000-000; NIFs are always 9 digits.
  // Angola has no equivalent structured postal-code convention in this
  // checkout, so neither is validated/required there.
  const PT_POSTAL_CODE_RE = /^\d{4}-\d{3}$/;
  const PT_TAX_ID_RE = /^\d{9}$/;

  const deliveryOptions = market === 'AO' ? settings.angolaDeliveryMethods : settings.portugalDeliveryMethods;
  const paymentOptions = market === 'AO' ? ['multicaixa_express'] : settings.portugalPaymentMethods;
  // Deployed widget credentials are the authoritative readiness signal. The
  // CMS toggle remains backwards-compatible, but a stale `false` must not
  // force a configured production checkout back to the manual fallback.
  const appyPayLive = settings.angolaPaymentLive || isAppyPayWidgetConfigured();

  const [deliveryMethod, setDeliveryMethod] = useState(deliveryOptions[0]);
  const [paymentMethod, setPaymentMethod] = useState(paymentOptions[0]);

  useEffect(() => {
    fetchMarketSettings()
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_MARKET_SETTINGS));
  }, []);

  // Stripe redirects back here (cancel_url) if the buyer backs out of
  // Checkout without paying -- surface that instead of silently landing on
  // an empty form.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe') === 'cancelled') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    // Market settings are external configuration; reset dependent form controls.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeliveryMethod(deliveryOptions[0]);
    setPaymentMethod(paymentOptions[0]);
    setForm((f) => ({
      ...f,
      country: market === 'AO' ? 'Angola' : 'Portugal',
      phoneCountryIso2: market === 'AO' ? 'AO' : 'PT',
    }));
    // The option arrays are selected from settings above; settings is the stable source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, settings]);

  // A coupon's discountAmount is resolved in whichever currency the
  // settlement actually happens in (see eurSubtotal/settlementSubtotal
  // below) -- switching payment method can change that currency (AO
  // Multicaixa is Kz, but AO Stripe/PayPal settle in EUR). This used to just
  // wipe an already-applied coupon outright and leave the shopper to notice
  // and reapply it -- confirmed during the 2026-07-26 QA pass that a real
  // order went through at full price because nobody noticed the silent
  // reset. See the revalidation effect below (after eurSubtotal is
  // computed), which replaces this: it re-checks the same code against the
  // new settlement context instead of just dropping it.
  //
  // Hooks must run in the same order on every render, so the values this
  // effect needs (subtotal/eurSubtotal/usesEurSettlement) are computed here,
  // above the "cart is empty" early return below, instead of in their
  // original spot after it -- they're plain derived data (no hooks inside),
  // so moving them earlier is safe and keeps every useEffect/useState call
  // unconditional.

  // Displayed to the shopper -- always Kz in Angola, regardless of which
  // payment method ends up handling the actual charge.
  const items = cart
    .map((item) => {
      const p = products.find((p) => p.id === item.id);
      if (!p) return null;
      return {
        product: cmsRelationshipId(p.id),
        productName: p.name,
        size: item.size,
        color: item.color,
        qty: item.qty,
        unitPrice: market === 'AO' ? p.effectivePriceKz : p.effectivePriceEur,
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const discountAmount = appliedCoupon?.discountAmount ?? 0;

  // Angola orders paid via Stripe or PayPal have to actually settle in EUR --
  // neither gateway supports AOA, and Stripe has no Angola merchant accounts
  // (2026-07-10 decision). Rather than invent a live FX rate, this reuses
  // each product's existing `priceEur` (the same Portugal price already in
  // the catalogue) as the EUR-equivalent unit price. The shopper still sees
  // Kz throughout the page -- only the payload actually sent to Stripe/
  // PayPal switches to these EUR figures; `market` stays 'AO' either way,
  // since it identifies the storefront/customer, not the settlement
  // currency. Multicaixa Express isn't a real gateway integration yet, so it
  // stays on the plain Kz order path below, same as before.
  const usesEurSettlement = market === 'AO' && (paymentMethod === 'stripe' || paymentMethod === 'paypal');

  // Hoisted out of buildOrderInput so the coupon "Apply" check (below) can
  // validate against the same EUR-settlement subtotal that will actually be
  // charged, instead of the always-Kz display subtotal above.
  const eurItems = cart
    .map((item) => {
      const p = products.find((p) => p.id === item.id);
      if (!p) return null;
      return {
        product: cmsRelationshipId(p.id),
        productName: p.name,
        size: item.size,
        color: item.color,
        qty: item.qty,
        unitPrice: p.effectivePriceEur,
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);
  const eurSubtotal = eurItems.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const settlementSubtotal = usesEurSettlement ? eurSubtotal : subtotal;

  // The order summary/total and "Pay Now" amount must always be computed
  // and displayed in whichever currency actually settles -- previously this
  // subtracted a EUR-denominated discountAmount (see the coupon-revalidation
  // effect above) from the always-Kz `subtotal`, producing a total that
  // silently mixed units (e.g. "-2.3 Kz" instead of "-1,950 Kz", confirmed
  // during the 2026-07-26 QA pass). shippingCost is already 0 for every
  // Angola order regardless of payment method, so this only changes
  // behaviour for the usesEurSettlement case. This also now matches
  // buildOrderInput's own EUR-branch total exactly, instead of computing an
  // independent (and previously inconsistent) display value.
  const merchandiseTotalAfterDiscount = Math.max(0, settlementSubtotal - discountAmount);
  const portugalShipping = normalizePortugalShipping(settings);
  const angolaShipping = normalizeAngolaShipping(settings);
  const shippingCost = checkoutShippingCost(market, deliveryMethod, merchandiseTotalAfterDiscount, settings, form.city);
  const total = merchandiseTotalAfterDiscount + shippingCost;
  const fmt = (n: number) => (market === 'PT' || usesEurSettlement ? `€${n.toFixed(2)}` : `${formatKz(n, lang)} Kz`);

  // Re-check (never silently drop) an already-applied coupon whenever the
  // payment or delivery method changes. Re-runs handleApplyCoupon's same
  // validateCoupon() call against the settlement context for the render
  // this effect fires from -- settlementSubtotal/usesEurSettlement above are
  // recomputed from paymentMethod/deliveryMethod on every render already, so
  // reading them via closure here is always current. If the code is still
  // valid, the (possibly different) discount amount replaces the old one
  // silently; if it's no longer valid, it's cleared with a visible message
  // instead of the previous silent reset, so the shopper always knows why
  // their total changed. Deliberately excludes appliedCoupon/subtotal/
  // eurSubtotal/form.email from deps: this only needs to re-run when the
  // *method* changes -- including them would either loop (this effect sets
  // appliedCoupon) or re-fire on unrelated field edits.
  useEffect(() => {
    const code = appliedCoupon?.code;
    if (!code) return;

    let cancelled = false;
    // Synchronous setState in an effect body, same accepted pattern as the
    // other effects in this component (see the market/settings reset effect
    // above) -- this is reacting to a payment/delivery-method change, not
    // synchronizing with an external system on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCouponChecking(true);
    setCouponError(null);

    validateCoupon({
      code,
      market,
      usesEurSettlement,
      subtotal: settlementSubtotal,
      customerEmail: form.email || undefined,
    })
      .then((result) => {
        if (cancelled) return;
        if (result.valid) {
          setAppliedCoupon({ code: result.code, discountAmount: result.discountAmount, label: result.label });
        } else {
          setAppliedCoupon(null);
          setCouponInput(code);
          setCouponError(t('couponRemovedOnMethodChange', lang));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setAppliedCoupon(null);
        setCouponInput(code);
        setCouponError(t('couponRemovedOnMethodChange', lang));
      })
      .finally(() => {
        if (!cancelled) setCouponChecking(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, deliveryMethod]);

  if (cart.length === 0) {
    return <Navigate to="/carrinho" replace />;
  }

  // Combined phone number sent to the CMS and to the AppyPay widget (which
  // strips non-digits itself) -- the country-code dropdown and the local
  // number are separate form fields for editing, but everywhere else in the
  // app just wants one phone string. The dropdown stores an iso2, not the
  // dial code directly (see ALL_COUNTRY_CODES comment above), so look the
  // code up here.
  const phoneDialCode = ALL_COUNTRY_CODES.find((c) => c.iso2 === form.phoneCountryIso2)?.code ?? '';
  const fullPhone = `${phoneDialCode} ${form.phone}`.trim();

  const buildOrderInput = (): CreateOrderInput => {
    if (usesEurSettlement) {
      return {
        market,
        customerName: form.name,
        customerPhone: fullPhone,
        customerEmail: form.email,
        address: form.address,
        addressLine2: form.addressLine2 || undefined,
        // This branch only runs when usesEurSettlement is true, which by
        // definition requires market === 'AO' -- postalCode is a PT-only
        // field, so it's always absent here.
        postalCode: undefined,
        city: form.city,
        country: form.country,
        taxId: form.taxId || undefined,
        notes: form.notes || undefined,
        items: eurItems,
        currency: 'EUR',
        subtotal: eurSubtotal,
        shippingCost: 0,
        couponCode: appliedCoupon?.code,
        total: Math.max(0, eurSubtotal - discountAmount),
        paymentMethod,
        deliveryMethod,
        lang,
        ...getMetaOrderContext(),
      };
    }

    return {
      market,
      customerName: form.name,
      customerPhone: fullPhone,
      customerEmail: form.email,
      address: form.address,
      addressLine2: form.addressLine2 || undefined,
      postalCode: market === 'PT' ? form.postalCode : undefined,
      city: form.city,
      country: form.country,
      taxId: form.taxId || undefined,
      notes: form.notes || undefined,
      items,
      currency: market === 'AO' ? 'Kz' : 'EUR',
      subtotal,
      shippingCost,
      couponCode: appliedCoupon?.code,
      total,
      paymentMethod,
      deliveryMethod,
      lang,
      ...getMetaOrderContext(),
    };
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponChecking(true);
    setCouponError(null);
    try {
      const result = await validateCoupon({
        code,
        market,
        usesEurSettlement,
        subtotal: settlementSubtotal,
        customerEmail: form.email || undefined,
      });
      if (result.valid) {
        setAppliedCoupon({ code: result.code, discountAmount: result.discountAmount, label: result.label });
      } else {
        setAppliedCoupon(null);
        setCouponError(localizeCouponError(result.reason, lang));
      }
    } catch {
      setAppliedCoupon(null);
      setCouponError(t('couponCheckFailed', lang));
    } finally {
      setCouponChecking(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  // The error banner (e.g. "Card payment is unavailable right now" from a
  // failed Stripe attempt, or a PayPal onError callback) belongs to whichever
  // payment method was selected when it was set. Left alone, it stayed on
  // screen after switching to a different, working method -- confirmed
  // during the 2026-07-26 QA pass, where a stale Stripe error kept showing
  // while MB WAY was selected and about to succeed. Only clears on an actual
  // change (not a re-click of the already-selected method), so a
  // still-relevant error for the current method isn't dismissed by accident.
  const handleSelectPaymentMethod = (method: string) => {
    if (method !== paymentMethod) setError(null);
    setPaymentMethod(method);
  };

  const validateRequiredFields = (): boolean => {
    if (!form.name || !form.phone || !form.email || !form.address || !form.city) {
      setError(t('fillRequiredFields', lang));
      return false;
    }
    if (market === 'PT') {
      if (!form.postalCode || !PT_POSTAL_CODE_RE.test(form.postalCode)) {
        setError(t('invalidPostalCode', lang));
        return false;
      }
      if (form.taxId && !PT_TAX_ID_RE.test(form.taxId)) {
        setError(t('invalidTaxId', lang));
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // PayPal has its own button/flow (see buildOrderInputForPaypal below) --
    // guards against an implicit form submit (e.g. pressing Enter in a
    // field) bypassing it, since no submit button is rendered in that case.
    if (paymentMethod === 'paypal') return;
    setError(null);
    if (!validateRequiredFields()) return;

    setSubmitting(true);
    try {
      if (paymentMethod === 'stripe') {
        const { sessionUrl } = await createStripeCheckoutSession(buildOrderInput());
        // Cart is cleared by the confirmation page itself, not here -- see
        // the comment on handlePaypalSuccess below for why.
        window.location.assign(sessionUrl);
        return; // navigating away -- no need to clear `submitting`
      }

      if (paymentMethod === 'multicaixa_express' && appyPayLive) {
        if (!isAppyPayWidgetConfigured()) {
          throw new Error('AppyPay widget credentials are missing');
        }
        const order = await createAppyPayOrder(buildOrderInput());
        setAppyPayOrder(order);
        return;
      }

      const order = await createOrder(buildOrderInput());
      navigate(`/encomenda-confirmada/${order.orderNumber}`);
    } catch (err) {
      console.error('Order/payment creation failed', err);
      setError(paymentMethod === 'stripe' ? t('stripeUnavailable', lang) : t('orderFailed', lang));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaypalSuccess = (orderNumber: string) => {
    // Cart is cleared by the confirmation page itself (ConfirmationLookup),
    // not here. Previously this called dispatchCart({type: 'CLEAR'}) before
    // (then after) navigate() -- but a real, fully-paid PayPal order kept
    // landing the buyer on "Your cart is empty" instead of the confirmation
    // page regardless of the order of those two calls: React 19 batches
    // both the route change and the cart-reducer update into the same
    // render pass either way, so Checkout's own
    // `if (cart.length === 0) navigate('/carrinho')` guard could still win
    // the race against this navigate(), no matter which line ran "first" in
    // the source. Clearing the cart from Checkout at all was the actual
    // mistake -- moving it to the destination page sidesteps the race
    // entirely, since by the time it runs, Checkout is already unmounted.
    navigate(`/encomenda-confirmada/${orderNumber}`);
  };

  /** PayPal's button fires its own createOrder callback on click, outside
   * the form's onSubmit -- so required-field validation has to happen here
   * too, not just in handleSubmit. */
  const buildOrderInputForPaypal = (): CreateOrderInput => {
    setError(null);
    if (!validateRequiredFields()) {
      throw new Error('Missing required fields');
    }
    return buildOrderInput();
  };

  return (
    <div className="ump-checkout-layout" style={{ background: C.paper, paddingBottom: 40 }}>
      <div style={{ padding: '20px 20px 12px', gridColumn: '1 / -1' }}>
        <h1 style={{ fontFamily: F.display, fontSize: 24, color: C.ink, fontWeight: 800, margin: '0 0 4px' }}>{t('checkout', lang)}</h1>
        {/* Market is fixed by the site the buyer is on (ao./pt. subdomain) --
            no in-checkout toggle anymore, since Angola and Portugal are now
            separate storefronts (see the header region switch to actually
            leave for the sibling site). */}
        <div style={{ fontSize: 11, fontWeight: 800, color: C.goldDeep, textTransform: 'uppercase', letterSpacing: 1 }}>
          {t(market === 'AO' ? 'angola' : 'portugal', lang)}
        </div>
      </div>

      {/* Two-column desktop layout (Phase 4, 2026-07-24, see
          .ump-checkout-layout in App.tsx): form sections in this column,
          order summary + submit sticky in the .ump-checkout-summary column
          below. The submit button physically lives in that second column
          but still submits this form via the form="checkout-form"
          attribute -- a native HTML button doesn't need to be a DOM
          descendant of its form, just reference its id -- which is what
          makes splitting them into separate grid columns possible at all
          without reaching for extra state/refs. */}
      <form id="checkout-form" onSubmit={handleSubmit} style={{ padding: '0 20px', minWidth: 0 }}>
        <Section title={t('contact', lang)}>
          <Field label={t('name', lang)} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <PhoneField
            label={t('phoneWhatsapp', lang)}
            lang={lang}
            countryIso2={form.phoneCountryIso2}
            onCountryIso2Change={(v) => setForm({ ...form, phoneCountryIso2: v })}
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
            required
          />
          <Field label={t('email', lang)} type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        </Section>

        <Section title={t('address', lang)}>
          <Field label={t('address', lang)} value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
          {market === 'PT' && (
            <Field
              label={t('addressLine2Optional', lang)}
              value={form.addressLine2}
              onChange={(v) => setForm({ ...form, addressLine2: v })}
            />
          )}
          {market === 'PT' && (
            <Field
              label={t('postalCode', lang)}
              value={form.postalCode}
              onChange={(v) => setForm({ ...form, postalCode: v })}
              placeholder="0000-000"
              required
            />
          )}
          {market === 'AO' ? (
            <label style={{ display: 'block', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.ink, marginBottom: 6 }}>{t('municipality', lang)} *</div>
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
                style={{ width: '100%', padding: '11px 12px', fontSize: 13, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, color: C.ink }}
              >
                <option value="">{t('selectMunicipality', lang)}</option>
                {LUANDA_MUNICIPALITIES.map((municipality) => (
                  <option key={municipality} value={municipality}>{municipality} — {angolaShipping.municipalityPrices[municipality].toLocaleString('pt-PT')} Kz</option>
                ))}
              </select>
            </label>
          ) : (
            <Field label={t('city', lang)} value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
          )}
          {market === 'AO' ? (
            <Field
              label={t('country', lang)}
              value={form.country}
              onChange={() => {}}
              required
              disabled
              hint={t('countryLockedAO', lang)}
            />
          ) : (
            <Field label={t('country', lang)} value={form.country} onChange={() => {}} required disabled hint={t('countryLockedPT', lang)} />
          )}
          <Field
            label={t('taxIdOptional', lang)}
            value={form.taxId}
            onChange={(v) => setForm({ ...form, taxId: v })}
            hint={t('taxIdHint', lang)}
          />
          <Field label={t('notesOptional', lang)} value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
        </Section>

        <Section title={t('delivery', lang)}>
          {deliveryOptions.map((opt) => (
            <RadioRow key={opt} name="delivery" value={opt} checked={deliveryMethod === opt} onSelect={() => setDeliveryMethod(opt)} label={DELIVERY_LABEL_KEYS[opt] ? t(DELIVERY_LABEL_KEYS[opt], lang) : opt} />
          ))}
          {market === 'PT' && (
            <div style={{ marginTop: 8, fontSize: 11, color: C.inkSoft, lineHeight: 1.5 }}>
              {t('portugalDeliveryTerms', lang).replace('{amount}', `€${portugalShipping.freeThreshold.toFixed(2)}`)}
            </div>
          )}
          {market === 'AO' && (
            <div style={{ marginTop: 8, fontSize: 11, color: C.inkSoft, lineHeight: 1.5 }}>
              {t('angolaDeliveryTerms', lang).replace('{amount}', `${angolaShipping.freeThreshold.toLocaleString('pt-PT')} Kz`)}
            </div>
          )}
        </Section>

        <Section title={t('payment', lang)}>
          {paymentOptions.map((opt) => (
            <RadioRow key={opt} name="payment" value={opt} checked={paymentMethod === opt} onSelect={() => handleSelectPaymentMethod(opt)} label={PAYMENT_LABEL_KEYS[opt] ? t(PAYMENT_LABEL_KEYS[opt], lang) : opt} />
          ))}
          {paymentMethod === 'multicaixa_express' && !appyPayLive && (
            <div style={{ marginTop: 8, padding: 12, background: C.subtleBg, borderRadius: 6, fontSize: 12, color: C.inkSoft, lineHeight: 1.5 }}>
              {pickBilingual(settings.angolaBankTransferInstructionsPT, settings.angolaBankTransferInstructionsEN, lang)}
            </div>
          )}
        </Section>
      </form>

      <div className="ump-checkout-summary" style={{ padding: '0 20px' }}>
        <div style={{ marginBottom: 12 }}>
          {appliedCoupon ? (
            <div data-testid="applied-coupon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 12px', background: C.tagBg, border: `1px solid ${C.gold}`, borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: C.ink }}>
                <span style={{ fontWeight: 800 }}>{appliedCoupon.code}</span> — {t('couponApplied', lang)}
              </div>
              <button type="button" onClick={handleRemoveCoupon} style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, textDecoration: 'underline', flexShrink: 0 }}>
                {t('couponRemove', lang)}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder={t('couponPlaceholder', lang)}
                aria-label={t('couponLabel', lang)}
                style={{ flex: 1, minWidth: 0, padding: '10px 12px', fontSize: 13, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, color: C.ink, textTransform: 'uppercase' }}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponChecking || !couponInput.trim()}
                style={{ padding: '0 16px', fontSize: 11, fontWeight: 800, color: C.ink, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, flexShrink: 0 }}
              >
                {couponChecking ? t('couponChecking', lang) : t('couponApply', lang)}
              </button>
            </div>
          )}
          {couponError && <div data-testid="coupon-error" style={{ marginTop: 6, fontSize: 11, color: '#B95545' }}>{couponError}</div>}
        </div>

        {usesEurSettlement && (
          <div data-testid="eur-settlement-notice" style={{ marginBottom: 12, padding: '10px 12px', background: C.subtleBg, border: `1px solid ${C.ruleLight}`, borderRadius: 6, fontSize: 11, color: C.inkSoft, lineHeight: 1.5 }}>
            {t('eurSettlementNotice', lang)}
          </div>
        )}

        <div style={{ background: C.subtleBg, borderRadius: 8, padding: 16, border: `1px solid ${C.ruleLight}` }}>
          <Row testId="checkout-subtotal" label={t('subtotal', lang)} value={fmt(settlementSubtotal)} />
          {discountAmount > 0 && <Row testId="checkout-discount" label={appliedCoupon?.label || t('discount', lang)} value={`-${fmt(discountAmount)}`} />}
          <Row testId="checkout-shipping" label={t('shipping', lang)} value={shippingCost === 0 ? t('free', lang) : fmt(shippingCost)} />
          <div style={{ borderTop: `1px solid ${C.rule}`, marginTop: 8, paddingTop: 8 }}>
            <Row testId="checkout-total" label={t('total', lang)} value={fmt(total)} bold />
          </div>
        </div>

        {error && (
          <div ref={errorRef} role="alert" tabIndex={-1} style={{ marginTop: 16, padding: 12, background: '#FBEAE4', color: '#A6483A', fontSize: 12, borderRadius: 6 }}>{error}</div>
        )}

        {appyPayOrder && (
          <div style={{ marginTop: 20, padding: 16, border: `1px solid ${C.rule}`, borderRadius: 8 }}>
            <AppyPayWidget
              amount={total}
              description={`Use Me With Style ${appyPayOrder.orderNumber}`}
              merchantTransactionId={appyPayOrder.merchantTransactionId}
              phoneNumber={fullPhone}
              lang={lang}
            />
            <button
              type="button"
              onClick={() => navigate(`/encomenda-confirmada/${appyPayOrder.orderNumber}`)}
              style={{ marginTop: 16, width: '100%', padding: 12 }}
            >
              Ver estado da encomenda
            </button>
          </div>
        )}

        {appyPayOrder ? null : paymentMethod === 'paypal' ? (
          <PaypalButton
            buildOrderInput={buildOrderInputForPaypal}
            onSuccess={handlePaypalSuccess}
            onError={(message) => setError(message)}
            lang={lang}
          />
        ) : (
          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            style={{
              width: '100%',
              marginTop: 20,
              padding: 14,
              background: submitting ? C.inkSoft : C.black,
              color: C.onDarkGold,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              borderRadius: 8,
            }}
          >
            {submitting ? (paymentMethod === 'stripe' ? t('stripeRedirecting', lang) : '…') : `${t('payNow', lang)} · ${fmt(total)}`}
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset style={{ margin: '0 0 20px', padding: 0, border: 0 }}>
      <legend style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.goldDeep, textTransform: 'uppercase', marginBottom: 10 }}>{title}</legend>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 11, color: C.inkSoft, marginBottom: 4 }}>
        {label}
        {required && ' *'}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: 13,
          border: `1px solid ${C.rule}`,
          borderRadius: 6,
          background: disabled ? C.subtleBg : C.paper,
          color: disabled ? C.inkSoft : C.ink,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
      {hint && <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 3 }}>{hint}</div>}
    </label>
  );
}

// Country-code + local-number pair for the phone/WhatsApp field (added
// 2026-07-24, user request; expanded from 15 curated countries to the full
// ~250-country list the same day per follow-up feedback, then converted
// from a native <select> to this custom searchable combobox once the
// native select's own text-truncation started clipping longer names like
// "Antígua e Barbuda" mid-word inside its fixed-width box -- a native
// <select> can't be given a search input either way. Defaults to PT/AO
// based on market (see the form-state init and the market-change effect in
// Checkout above); the dropdown itself stays changeable in both markets
// since a buyer's own phone might not match the storefront's market
// (diaspora, international shipping, etc.). Selection is keyed by iso2
// rather than dial code -- see the ALL_COUNTRY_CODES comment for why
// (several countries share a dial code, e.g. +1).
function PhoneField({
  label,
  lang,
  countryIso2,
  onCountryIso2Change,
  value,
  onChange,
  required = false,
}: {
  label: string;
  lang: Lang;
  countryIso2: string;
  onCountryIso2Change: (v: string) => void;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const options = useMemo(() => countryCodeOptionsFor(lang), [lang]);
  const selected = options.find((c) => c.iso2 === countryIso2) ?? options[0];

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onDocMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (c) => c.nameEN.toLowerCase().includes(q) || c.namePT.toLowerCase().includes(q) || c.code.includes(q) || c.iso2.toLowerCase() === q,
    );
  }, [options, query]);

  const selectAndClose = (iso2: string) => {
    onCountryIso2Change(iso2);
    setOpen(false);
    setQuery('');
  };

  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 11, color: C.inkSoft, marginBottom: 4 }}>
        {label}
        {required && ' *'}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Country code"
            aria-haspopup="listbox"
            aria-expanded={open}
            style={{
              width: 96,
              padding: '10px 6px',
              fontSize: 13,
              border: `1px solid ${C.rule}`,
              borderRadius: 6,
              background: C.paper,
              color: C.ink,
              textAlign: 'left',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {selected ? `${flagEmoji(selected.iso2)} ${selected.code}` : ''}
          </button>
          {open && (
            <div
              role="listbox"
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                // Fixed at 270px, which fits with room to spare on every
                // phone width actually verified (down to ~360-375px) -- but
                // is anchored left:0 to this button, which itself sits right
                // after the page's 20px padding. On a genuinely tiny/old
                // device (~310px or narrower) a bare 270px could crowd the
                // right edge of the screen. min() keeps the same 270px on
                // every device that's been tested while adding a safety
                // margin for anything narrower (2026-07-24, responsive
                // audit, Finding 5).
                width: 'min(270px, calc(100vw - 48px))',
                background: C.paper,
                border: `1px solid ${C.rule}`,
                borderRadius: 8,
                boxShadow: '0 10px 28px rgba(0,0,0,0.16)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setOpen(false);
                    setQuery('');
                  } else if (e.key === 'Enter' && filtered.length > 0) {
                    e.preventDefault();
                    selectAndClose(filtered[0].iso2);
                  }
                }}
                placeholder={lang === 'pt' ? 'Pesquisar país…' : 'Search country…'}
                style={{
                  margin: 8,
                  padding: '8px 10px',
                  fontSize: 13,
                  border: `1px solid ${C.rule}`,
                  borderRadius: 6,
                  background: C.paper,
                  color: C.ink,
                }}
              />
              <div style={{ overflowY: 'auto', maxHeight: 260 }}>
                {filtered.length === 0 && (
                  <div style={{ padding: '10px 12px', fontSize: 12, color: C.inkSoft }}>
                    {lang === 'pt' ? 'Nenhum país encontrado.' : 'No countries found.'}
                  </div>
                )}
                {filtered.map((c) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.iso2 === countryIso2}
                    key={c.iso2}
                    onClick={() => selectAndClose(c.iso2)}
                    style={{
                      display: 'flex',
                      width: '100%',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      fontSize: 13,
                      textAlign: 'left',
                      background: c.iso2 === countryIso2 ? C.subtleBg : 'transparent',
                      color: C.ink,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{flagEmoji(c.iso2)}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lang === 'pt' ? c.namePT : c.nameEN}
                    </span>
                    <span style={{ color: C.inkSoft, flexShrink: 0 }}>{c.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          style={{ flex: 1, minWidth: 0, padding: '10px 12px', fontSize: 13, border: `1px solid ${C.rule}`, borderRadius: 6, background: C.paper, color: C.ink }}
        />
      </div>
    </label>
  );
}

function RadioRow({ checked, onSelect, label, name, value }: { checked: boolean; onSelect: () => void; label: string; name: string; value: string }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        border: `1px solid ${checked ? C.gold : C.rule}`,
        borderRadius: 6,
        background: checked ? C.tagBg : C.paper,
        textAlign: 'left',
        width: '100%',
      }}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} style={{ accentColor: C.gold }} />
      <span style={{ fontSize: 13, color: C.ink }}>{label}</span>
    </label>
  );
}

function Row({ label, value, bold = false, testId }: { label: string; value: string; bold?: boolean; testId?: string }) {
  return (
    <div data-testid={testId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: bold ? 15 : 13, fontWeight: bold ? 800 : 400, color: bold ? C.ink : C.inkSoft, padding: '3px 0' }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
