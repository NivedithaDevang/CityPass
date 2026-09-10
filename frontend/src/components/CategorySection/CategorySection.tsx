import "./CategorySection.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type Category } from "../../types/auth";
import { useNavigate } from "react-router-dom";
function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([]);
const navigate = useNavigate();
  const categoryImages: Record<string, string> = {
    Music: "/categories/music.jpeg",
    Sports: "/categories/sports.jpeg",
    Comedy: "/categories/comedy.jpeg",
    Food: "/categories/food.jpeg",
    Art: "/categories/art.jpeg",
    Adventure: "/categories/adventure.jpeg",
    Entertainment: "/categories/entertainment.jpeg",
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/v1/categories`);
        setCategories(response.data.categories);
      } catch (error) {
        console.log("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section className="category-section">
      <div className="section-heading">
        <h2>EXPLORE BY CATEGORIES</h2>
        <p>Curated entertainment, live gigs & dining experiences</p>
      </div>

      <div className="category-grid">
        {categories
          .filter((category) => category.is_active)
          .map((category) => (
            <div className="category-card" key={category.id}>
              <img
                src={categoryImages[category.name]}
                alt={category.name}
onClick={() => navigate('/events')} style={{ cursor: 'pointer' }}              />

              <h2>{category.name}</h2>
            </div>
          ))}
      </div>
    </section>
  );
}

export default CategorySection;