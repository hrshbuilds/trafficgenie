// Quick test to verify violations data transformation
import * as violationApi from '../services/api/violationApi';

export async function testViolationsData() {
  try {
    console.log('🧪 Testing violations API...');
    
    const data = await violationApi.fetchViolations({ limit: 5 });
    console.log('✅ API Response:', data);
    console.log('✅ Count:', data.length);
    
    if (data.length > 0) {
      console.log('✅ First violation fields:');
      const v = data[0];
      console.log('   - id:', v.id);
      console.log('   - type:', v.type);
      console.log('   - location:', v.location);
      console.log('   - confidence:', v.confidence);
      console.log('   - challan_status:', v.challan_status);
    }
    
    return data;
  } catch (err) {
    console.error('❌ Error fetching violations:', err);
    return [];
  }
}
