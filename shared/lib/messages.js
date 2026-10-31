const messages = {
  CART_MERGE_CONFLICT: [
    'Check the availability and quantities of your saved items, then try again.',
    'راجع إتاحة اختياراتك المحفوظة وكمياتها، ثم حاول مجددًا.',
  ],
  PRODUCT_SLUG_EXISTS: [
    'This product URL name is already in use. Edit the slug and save again.',
    'اسم رابط المنتج مستخدم بالفعل. عدّل حقل Slug ثم احفظ مجددًا.',
  ],
  CATEGORY_SLUG_EXISTS: [
    'This category URL name is already in use. Edit the slug and save again.',
    'اسم رابط التصنيف مستخدم بالفعل. عدّل حقل Slug ثم احفظ مجددًا.',
  ],
  CART_INSUFFICIENT_STOCK: [
    'The quantity already in your cart plus this selection exceeds available stock. Reduce the quantity or review your cart.',
    'الكمية الموجودة في السلة مع هذا الاختيار تتجاوز المخزون المتاح. قلل الكمية أو راجع السلة.',
  ],
  INVALID_CART_QUANTITY: [
    'Enter a valid whole-number quantity within the available stock.',
    'أدخل كمية صحيحة ضمن المخزون المتاح.',
  ],
  CHECKOUT_IDENTITY_CHANGED: [
    'The signed-in account changed. Review your cart before continuing.',
    'تغير الحساب المستخدم. راجع السلة قبل المتابعة.',
  ],
  ORDER_REQUEST_CONFLICT: [
    'An earlier checkout still needs confirmation. Open your cart and resolve that checkout before starting another.',
    'ما زال طلب سابق يحتاج إلى تأكيد النتيجة. افتح السلة وتحقق منه قبل بدء طلب آخر.',
  ],
  API_UNCONFIGURED: ['The service is not connected yet.', 'الخدمة غير متصلة حاليًا.'],
  NETWORK_ERROR: [
    'Could not connect. Check your connection and try again.',
    'تعذر الاتصال. تحقق من اتصالك وحاول مرة أخرى.',
  ],
  UNAUTHORIZED: [
    'Your session has ended. Please sign in again.',
    'انتهت جلستك. سجّل الدخول مرة أخرى.',
  ],
  FORBIDDEN: ['You do not have permission for this action.', 'ليس لديك صلاحية لتنفيذ هذا الإجراء.'],
  VALIDATION_ERROR: ['Check the highlighted fields.', 'راجع الحقول الموضحة.'],
  TOO_MANY_REQUESTS: [
    'Too many attempts. Wait before trying again.',
    'محاولات كثيرة. انتظر قبل المحاولة مرة أخرى.',
  ],
  INVALID_RESPONSE: [
    'The service returned an unreadable response. Please try again later.',
    'استجابة الخدمة غير متاحة. حاول مرة أخرى لاحقًا.',
  ],
  INVALID_BINARY: ['The image could not be opened.', 'تعذر فتح الصورة.'],
}
export function errorMessage(error, language = 'en') {
  const copy = messages[error?.code]
  if (copy) return copy[language === 'ar' ? 1 : 0]
  return error?.status >= 400 && error.status < 500 && error.message
    ? error.message
    : language === 'ar'
      ? 'تعذر إكمال الطلب. حاول مرة أخرى لاحقًا.'
      : 'Could not complete the request. Please try again later.'
}
