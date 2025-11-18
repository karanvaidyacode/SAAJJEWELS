import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ProductRecommendations = ({ currentProduct }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock function to get product recommendations
  const getMockRecommendations = async (product) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock recommendations
    return [
      {
        id: 'rec1',
        name: 'Similar Diamond Ring',
        originalPrice: 1299.99,
        discountedPrice: 999.99,
        image: '/placeholder.svg',
        description: 'A beautiful diamond ring similar to your selection',
        category: 'rings'
      },
      {
        id: 'rec2',
        name: 'Matching Gold Necklace',
        originalPrice: 899.99,
        discountedPrice: 699.99,
        image: '/placeholder.svg',
        description: 'A perfect match for your selected item',
        category: 'necklaces'
      },
      {
        id: 'rec3',
        name: 'Complementary Earrings',
        originalPrice: 499.99,
        discountedPrice: 399.99,
        image: '/placeholder.svg',
        description: 'Earrings that complement your selection',
        category: 'earrings'
      }
    ];
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!currentProduct) return;
      
      setLoading(true);
      try {
        const recs = await getMockRecommendations(currentProduct);
        setRecommendations(recs);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentProduct]);

  if (loading) {
    return <div className="text-center py-4">Loading recommendations...</div>;
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">You Might Also Like</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover"
            />
            <CardContent className="p-4">
              <h4 className="font-medium mb-1">{product.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">${product.discountedPrice}</span>
                  {product.originalPrice > product.discountedPrice && (
                    <span className="text-sm text-gray-500 line-through ml-2">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>
                <Button size="sm">View</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductRecommendations;