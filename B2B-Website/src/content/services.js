import spinning from '../../../shared/assets/images/spinning.webp'
import fabric from '../../../shared/assets/images/fabric.webp'
import weaving from '../../../shared/assets/images/weaving.webp'
import uniforms from '../../../shared/assets/images/uniforms.webp'
import wholesale from '../../../shared/assets/images/wholesale.webp'

const serviceContent = {
  spinning: {
    en: {
      title: 'Spinning',
      summary: 'Explore yarn development as part of a manufacturing conversation.',
      detail:
        'Share the yarn and end use you have in mind. The team can discuss the technical requirements and next steps with you.',
      imageAlt: 'Illustrative textile spinning scene',
    },
    ar: {
      title: 'الغزل',
      summary: 'ناقش تطوير الخيوط ضمن متطلبات التصنيع.',
      detail:
        'شاركنا نوع الخيط والاستخدام الذي تفكر فيه، وسنوضح المتطلبات الفنية والخطوات التالية خلال النقاش.',
      imageAlt: 'رسم توضيحي لمرحلة الغزل',
    },
  },
  weaving: {
    en: {
      title: 'Weaving',
      summary: 'Discuss fabric construction and the result you want to achieve.',
      detail:
        'Tell us about the fabric structure, weight, and intended use. Requirements can be reviewed together before a project is defined.',
      imageAlt: 'Illustrative textile weaving scene',
    },
    ar: {
      title: 'النسيج',
      summary: 'ناقش تركيب القماش والنتيجة التي ترغب في الوصول إليها.',
      detail:
        'أخبرنا عن تركيب القماش ووزنه واستخدامه المقصود، ويمكن مراجعة المتطلبات معًا قبل تحديد المشروع.',
      imageAlt: 'رسم توضيحي لمرحلة النسيج',
    },
  },
  fabric: {
    en: {
      title: 'Fabric & manufacturing',
      summary: 'From your design to a bulk production request.',
      detail:
        'Tell us what you want to produce, the quantity, and whether you already have the fabric. Our team will discuss the details directly.',
      imageAlt: 'Illustrative fabric cutting scene',
    },
    ar: {
      title: 'الأقمشة والتصنيع',
      summary: 'من التصميم إلى طلب إنتاج بالجملة.',
      detail:
        'أخبرنا بالمنتج المطلوب والكمية وما إذا كان القماش متوفرًا لديك. يناقش فريقنا التفاصيل معك مباشرة.',
      imageAlt: 'رسم توضيحي لقص الأقمشة',
    },
  },
  'school-uniforms': {
    en: {
      title: 'School uniforms',
      summary: 'Share your uniform brief and the requirements that matter to your institution.',
      detail:
        'Include the intended garments, audience, and any reference material. The team can review the brief with you and clarify what information is needed next.',
      imageAlt: 'Illustrative school uniform garments',
    },
    ar: {
      title: 'الزي المدرسي',
      summary: 'شاركنا متطلبات الزي وما يهم مؤسستك.',
      detail:
        'اذكر القطع المطلوبة والفئة المستهدفة وأي مراجع متاحة. يمكن للفريق مراجعة الطلب معك وتوضيح المعلومات المطلوبة للخطوة التالية.',
      imageAlt: 'رسم توضيحي لملابس مدرسية',
    },
  },
  wholesale: {
    en: {
      title: 'Wholesale',
      summary: 'Explore ready-made supply for your business.',
      detail:
        'Share the product types, quantities, and timing you are considering. The team can review your inquiry and explain the next steps.',
      imageAlt: 'Illustrative ready-made clothing selection',
    },
    ar: {
      title: 'الجملة',
      summary: 'استكشف توريد الملابس الجاهزة لمشروعك.',
      detail:
        'شاركنا أنواع المنتجات والكميات والتوقيت الذي تفكر فيه، وسيراجع الفريق استفسارك ويوضح الخطوات التالية.',
      imageAlt: 'رسم توضيحي لمجموعة ملابس جاهزة',
    },
  },
}

const serviceImages = { spinning, weaving, fabric, 'school-uniforms': uniforms, wholesale }
const serviceImageKeys = {
  spinning: 'service-spinning',
  weaving: 'service-weaving',
  fabric: 'service-fabric',
  'school-uniforms': 'service-school-uniforms',
  wholesale: 'service-wholesale',
}
const imageDimensions = {
  spinning: [960, 640],
  weaving: [1200, 800],
  fabric: [960, 640],
  'school-uniforms': [1200, 800],
  wholesale: [1200, 800],
}
const steps = {
  en: [
    ['01', 'Choose your service', 'Select the service that best matches your project.'],
    ['02', 'Share the details', 'Tell us what you need through the inquiry form.'],
    ['03', 'Talk to our team', 'We will review your request and discuss the next step.'],
  ],
  ar: [
    ['٠١', 'اختر الخدمة', 'حدد الخدمة الأقرب إلى مشروعك.'],
    ['٠٢', 'شارك التفاصيل', 'أخبرنا بما تحتاج إليه عبر نموذج الاستفسار.'],
    ['٠٣', 'تحدث مع فريقنا', 'سنراجع طلبك ونناقش الخطوة التالية.'],
  ],
}

export { serviceContent, serviceImages, serviceImageKeys, imageDimensions, steps }
