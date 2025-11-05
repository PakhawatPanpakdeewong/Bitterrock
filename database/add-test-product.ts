import { query, closePool } from './connection';

async function addProduct() {
  try {
    const productData = {
      sub_category_id: null,
      product_name_th: 'ชุดดูแลเล็บทารก 4-in-1 พร้อมกรรไกรและตะไบในกล่องพกพา',
      product_name_en: '4-in-1 Baby Manicure & Pedicure Set with Travel Case',
      description: 'ครบจบในชุดเดียวสำหรับการดูแลเล็บของลูกน้อย ประกอบด้วยกรรไกรตัดเล็บปลายมน, ตะไบเล็บเนื้อละเอียด, กรรไกรตัดหนัง และที่คีบอเนกประสงค์ บรรจุในกล่องเก็บอย่างดี ป้องกันเชื้อโรค เหมาะสำหรับพกพาเดินทาง',
      base_sku: 'BNS-SDF',
      base_price: 75.00
    };

    console.log('🔍 Attempting to insert product:', productData);

    const insertRes = await query(
      `INSERT INTO products (subcategoryid, productnameth, productnameen, description, basesku, baseprice)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING productid as product_id`,
      [
        productData.sub_category_id,
        productData.product_name_th,
        productData.product_name_en,
        productData.description,
        productData.base_sku,
        productData.base_price
      ]
    );

    const newId = insertRes.rows[0]?.product_id;
    console.log('✅ SUCCESS: Product inserted with ID:', newId);
    console.log('📦 Product Details:');
    console.log('   - Product ID:', newId);
    console.log('   - Name (TH):', productData.product_name_th);
    console.log('   - Name (EN):', productData.product_name_en);
    console.log('   - SKU:', productData.base_sku);
    console.log('   - Price:', productData.base_price);
    
    return newId;
  } catch (error: any) {
    console.error('❌ ERROR inserting product:');
    console.error('   Error code:', error?.code);
    console.error('   Error message:', error?.message);
    console.error('   Full error:', error);
    throw error;
  } finally {
    await closePool();
  }
}

// Run the script
addProduct()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

