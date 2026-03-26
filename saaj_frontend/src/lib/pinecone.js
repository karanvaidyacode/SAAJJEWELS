// Remove Pinecone references and replace with mock functions

// Mock function to search for similar products
export const searchSimilarProducts = async (product, limit = 5) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Return mock similar products
  return [
    {
      id: 'sim1',
      name: 'Similar Product 1',
      originalPrice: 199.99,
      discountedPrice: 149.99,
      image: '/placeholder.svg',
      description: 'A product similar to your selection',
      category: product.category || 'jewelry'
    },
    {
      id: 'sim2',
      name: 'Similar Product 2',
      originalPrice: 299.99,
      discountedPrice: 249.99,
      image: '/placeholder.svg',
      description: 'Another product similar to your selection',
      category: product.category || 'jewelry'
    },
    {
      id: 'sim3',
      name: 'Similar Product 3',
      originalPrice: 399.99,
      discountedPrice: 349.99,
      image: '/placeholder.svg',
      description: 'Yet another product similar to your selection',
      category: product.category || 'jewelry'
    }
  ];
};

// Mock function to get product recommendations
export const getProductRecommendations = async (userId, limit = 5) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Return mock recommendations
  return [
    {
      id: 'rec1',
      name: 'Recommended Product 1',
      originalPrice: 159.99,
      discountedPrice: 119.99,
      image: '/placeholder.svg',
      description: 'A product we think you might like',
      category: 'rings'
    },
    {
      id: 'rec2',
      name: 'Recommended Product 2',
      originalPrice: 259.99,
      discountedPrice: 219.99,
      image: '/placeholder.svg',
      description: 'Another product we think you might like',
      category: 'necklaces'
    }
  ];
};

// Mock function to search products by vector
export const searchProductsByVector = async (queryVector, limit = 10) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Return mock search results
  return [
    {
      id: 'search1',
      name: 'Search Result 1',
      originalPrice: 179.99,
      discountedPrice: 139.99,
      image: '/placeholder.svg',
      description: 'A product matching your search',
      category: 'earrings'
    },
    {
      id: 'search2',
      name: 'Search Result 2',
      originalPrice: 279.99,
      discountedPrice: 239.99,
      image: '/placeholder.svg',
      description: 'Another product matching your search',
      category: 'bracelets'
    }
  ];
};