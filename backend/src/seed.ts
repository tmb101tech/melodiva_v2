import { supabase } from './config/database.js';
import { hashPassword } from './utils/auth.js';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    const adminPassword = await hashPassword(process.env.ADMIN_PASSWORD || 'admin123');

    await supabase.from('admins').upsert({
      username: process.env.ADMIN_USERNAME || 'admin',
      password_hash: adminPassword
    }, { onConflict: 'username' });

    console.log('✅ Admin created');

    const products = [
      {
        name: 'African Black Soap - Small',
        description: 'Premium handcrafted African black soap made with natural ingredients. Perfect for all skin types, helps with acne, eczema, and provides deep cleansing.',
        slug: 'african-black-soap-small',
        category: 'BLACK_SOAP',
        images: ['https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg'],
        active: true
      },
      {
        name: 'African Black Soap - Large',
        description: 'Large size premium African black soap. Natural, chemical-free, and perfect for the whole family. Lasts longer and offers better value.',
        slug: 'african-black-soap-large',
        category: 'BLACK_SOAP',
        images: ['https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg'],
        active: true
      },
      {
        name: 'Palm Kernel Oil - Small',
        description: 'Pure, cold-pressed palm kernel oil rich in vitamins and antioxidants. Great for skin and hair care, cooking, and massage.',
        slug: 'palm-kernel-oil-small',
        category: 'KERNEL_OIL',
        images: ['https://images.pexels.com/photos/4202325/pexels-photo-4202325.jpeg'],
        active: true
      },
      {
        name: 'Palm Kernel Oil - Large',
        description: 'Large bottle of pure palm kernel oil. Multipurpose oil perfect for beauty routines, cooking, and natural remedies.',
        slug: 'palm-kernel-oil-large',
        category: 'KERNEL_OIL',
        images: ['https://images.pexels.com/photos/4202325/pexels-photo-4202325.jpeg'],
        active: true
      }
    ];

    for (const product of products) {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('slug', product.slug)
        .maybeSingle();

      if (!existingProduct) {
        const { data: newProduct } = await supabase
          .from('products')
          .insert(product)
          .select()
          .single();

        if (newProduct) {
          let skus: any[] = [];

          if (product.category === 'BLACK_SOAP') {
            skus = [
              { size_label: '500g', size_unit: 'kg', size_value: 0.5, price: 2500, stock: 100 },
              { size_label: '1kg', size_unit: 'kg', size_value: 1, price: 4500, stock: 100 },
              { size_label: '2kg', size_unit: 'kg', size_value: 2, price: 8000, stock: 50 }
            ];
          } else {
            skus = [
              { size_label: '250ml', size_unit: 'L', size_value: 0.25, price: 1500, stock: 100 },
              { size_label: '500ml', size_unit: 'L', size_value: 0.5, price: 2800, stock: 100 },
              { size_label: '1L', size_unit: 'L', size_value: 1, price: 5000, stock: 50 }
            ];
          }

          for (const sku of skus) {
            await supabase.from('skus').insert({
              product_id: newProduct.id,
              ...sku
            });
          }

          console.log(`✅ Created product: ${product.name}`);
        }
      } else {
        console.log(`⏭️  Product already exists: ${product.name}`);
      }
    }

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
