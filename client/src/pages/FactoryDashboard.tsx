import React, { useEffect, useState } from 'react';
import '../App.css';
import { marketplaceAPI } from '../services/api.ts';
import { useAuth } from '../mockHooks.tsx';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: { tokenAmount: number };
  status: string;
  images?: string[];
  stock: number;
}

interface MaterialInventory {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: string;
  lastUpdated: string;
}

interface ProductionItem {
  id: string;
  productName: string;
  quantity: number;
  status: string;
  startDate: string;
  estimatedCompletion: string;
  priority: 'low' | 'medium' | 'high';
}

const FactoryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [materialInventory, setMaterialInventory] = useState<MaterialInventory[]>([]);
  const [productionQueue, setProductionQueue] = useState<ProductionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch products
        const res = await marketplaceAPI.getProducts();
        setProducts(res.data.products || []);
        
        // Mock material inventory data
        const mockMaterialInventory: MaterialInventory[] = [
          { id: '1', name: 'Recycled Plastic', quantity: 500, unit: 'kg', status: 'In Stock', lastUpdated: '2023-06-15' },
          { id: '2', name: 'Organic Cotton', quantity: 200, unit: 'kg', status: 'Low Stock', lastUpdated: '2023-06-14' },
          { id: '3', name: 'Bamboo Fiber', quantity: 350, unit: 'kg', status: 'In Stock', lastUpdated: '2023-06-13' },
          { id: '4', name: 'Recycled Paper', quantity: 100, unit: 'kg', status: 'Critical', lastUpdated: '2023-06-12' },
          { id: '5', name: 'Eco-friendly Dye', quantity: 50, unit: 'L', status: 'In Stock', lastUpdated: '2023-06-11' },
        ];
        setMaterialInventory(mockMaterialInventory);
        
        // Mock production queue data
        const mockProductionQueue: ProductionItem[] = [
          { id: '1', productName: 'Eco-friendly T-shirt', quantity: 100, status: 'In Progress', startDate: '2023-06-10', estimatedCompletion: '2023-06-20', priority: 'high' },
          { id: '2', productName: 'Recycled Tote Bag', quantity: 200, status: 'Scheduled', startDate: '2023-06-21', estimatedCompletion: '2023-06-30', priority: 'medium' },
          { id: '3', productName: 'Bamboo Water Bottle', quantity: 150, status: 'Quality Check', startDate: '2023-06-01', estimatedCompletion: '2023-06-15', priority: 'high' },
          { id: '4', productName: 'Eco-friendly Notebook', quantity: 300, status: 'Pending Materials', startDate: '2023-06-25', estimatedCompletion: '2023-07-05', priority: 'low' },
        ];
        setProductionQueue(mockProductionQueue);
      } catch (e) {
        setError('Failed to load factory data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getStatusStyle = (status: string) => {
    const baseStyle = { padding: '4px 8px', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 'bold' };
    switch (status) {
      case 'In Stock':
        return { ...baseStyle, backgroundColor: '#e8f5e8', color: '#2e7d32' };
      case 'Low Stock':
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
      case 'Critical':
      case 'Out of Stock':
        return { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' };
      default:
        return { ...baseStyle, backgroundColor: '#e3f2fd', color: '#1565c0' };
    }
  };

  const getPriorityStyle = (priority: string) => {
    const baseStyle = { padding: '4px 8px', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 'bold' };
    switch (priority) {
      case 'high':
        return { ...baseStyle, backgroundColor: '#ffebee', color: '#d32f2f' };
      case 'medium':
        return { ...baseStyle, backgroundColor: '#fff3e0', color: '#f57c00' };
      case 'low':
        return { ...baseStyle, backgroundColor: '#f3e5f5', color: '#7b1fa2' };
      default:
        return { ...baseStyle, backgroundColor: '#e3f2fd', color: '#1565c0' };
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>Loading factory dashboard...</div>
    </div>
  );
  
  if (error) return (
    <div style={{ margin: '20px' }}>
      <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
        Error: {error}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Factory Dashboard {user && `- ${user.name}`}</h1>
      
      {/* Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ color: '#1976d2', margin: '0 0 8px 0' }}>Active Products</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{products.length}</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ color: '#1976d2', margin: '0 0 8px 0' }}>Production Queue</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{productionQueue.length}</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ color: '#1976d2', margin: '0 0 8px 0' }}>Material Types</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{materialInventory.length}</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ color: '#1976d2', margin: '0 0 8px 0' }}>Quality Reports</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>0</div>
        </div>
      </div>
      
      {/* Material Inventory Section */}
      <h2 style={{ marginTop: '32px', marginBottom: '16px' }}>Material Inventory</h2>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f5f5f5' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Material</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Quantity</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Unit</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Last Updated</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {materialInventory.map((material) => (
              <tr key={material.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{material.name}</td>
                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>{material.quantity}</td>
                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>{material.unit}</td>
                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                  <span style={getStatusStyle(material.status)}>
                    {material.status}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>{material.lastUpdated}</td>
                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                  <button style={{ padding: '6px 12px', fontSize: '0.875rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Production Queue Section */}
      <h2 style={{ marginBottom: '16px' }}>Production Queue</h2>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f5f5f5' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Product</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Quantity</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Start Date</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Est. Completion</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Priority</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {productionQueue.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{item.productName}</td>
                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>{item.quantity}</td>
                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                  <span style={getStatusStyle(item.status)}>
                    {item.status}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>{item.startDate}</td>
                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>{item.estimatedCompletion}</td>
                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                  <span style={getPriorityStyle(item.priority)}>
                    {item.priority.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                  <button style={{ padding: '6px 12px', fontSize: '0.875rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Products Section */}
      <h2 style={{ marginBottom: '16px' }}>Your Products</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {products.map((p) => (
          <div key={p._id} style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '200px', overflow: 'hidden', marginBottom: '16px', borderRadius: '4px' }}>
              <img 
                src={(p.images && p.images[0]) || '/logo192.png'} 
                alt={p.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <h3 style={{ margin: '0 0 8px 0' }}>{p.name}</h3>
            <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '0.875rem', flexGrow: 1 }}>
              {p.description}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong>{p.price?.tokenAmount} EcoTokens</strong>
              <span style={getStatusStyle(p.status)}>
                {p.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem' }}>Stock: {p.stock || 0}</span>
              <button style={{ padding: '6px 12px', fontSize: '0.875rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Section */}
      <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <button style={{ padding: '12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add New Product</button>
          <button style={{ padding: '12px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Schedule Production</button>
          <button style={{ padding: '12px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Order Materials</button>
          <button style={{ padding: '12px', backgroundColor: '#9c27b0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Quality Reports</button>
        </div>
      </div>
    </div>
  );
};

export default FactoryDashboard;