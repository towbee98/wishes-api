export enum IProviders {
  SHOPIFY = 'shopify',
  WIX = 'wix',
}

export const ShopifyScopes = [
  'write_draft_orders',
  'write_products',
  'read_shipping',
  'write_orders',
  'read_orders',
  'read_assigned_fulfillment_orders',
  'write_assigned_fulfillment_orders',
  'read_cart_transforms',
  'write_cart_transforms',
  'read_checkouts',
  'write_checkouts',
  'write_fulfillments',
  'read_fulfillments',
  'read_inventory',
  'write_inventory',
];

export const ShopifyAuthRedirect =
  'https://api.wishpo.com/wish/shopify/complete-installation';

export const ShopifyUninstallAppEndpoint =
  'https://api.wishpo.com/webhook/shopify/app/uninstall';

export interface IShopifyData {
  accessToken: IAccessToken | null;
  shop_domain: string;
  shopProviderInformation: IShopifyStoreInformation | null;
  nonce: any;
}

export interface IAccessToken {
  accessToken: any;
  // access_token: string;
  scope: string;
}

export interface IShopifyStoreInformation {
  id: number;
  name: string;
  email: string;
  domain: string;
  province: null;
  country: string;
  address1: null;
  zip: null;
  city: null;
  source: null;
  phone: null;
  latitude: null;
  longitude: null;
  primary_locale: string;
  address2: null;
  created_at: Date;
  updated_at: Date;
  country_code: string;
  country_name: string;
  currency: string;
  customer_email: string;
  timezone: string;
  iana_timezone: string;
  shop_owner: string;
  money_format: string;
  money_with_currency_format: string;
  weight_unit: string;
  province_code: null;
  taxes_included: boolean;
  auto_configure_tax_inclusivity: null;
  tax_shipping: null;
  county_taxes: boolean;
  plan_display_name: string;
  plan_name: string;
  has_discounts: boolean;
  has_gift_cards: boolean;
  myshopify_domain: string;
  google_apps_domain: null;
  google_apps_login_enabled: null;
  money_in_emails_format: string;
  money_with_currency_in_emails_format: string;
  eligible_for_payments: boolean;
  requires_extra_payments_agreement: boolean;
  password_enabled: boolean;
  has_storefront: boolean;
  finances: boolean;
  primary_location_id: number;
  checkout_api_supported: boolean;
  multi_location_enabled: boolean;
  setup_required: boolean;
  pre_launch_enabled: boolean;
  enabled_presentment_currencies: string[];
  transactional_sms_disabled: boolean;
  marketing_sms_consent_enabled_at_checkout: boolean;
}

export enum IProviderStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  DECLINED = 'declined',
  BANNED = 'banned',
  INPROGRESS = 'inprogress',
  DELETED = 'deleted',
}
