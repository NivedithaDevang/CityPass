import "./CategorySection.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type Category } from "../../types/auth";
import { useNavigate } from "react-router-dom";
import { FaMicrophone, FaLaughSquint } from "react-icons/fa";
import { MdSportsFootball, MdTheaterComedy } from "react-icons/md";
import { IoFastFoodSharp } from "react-icons/io5";
import { FaPaintbrush, FaMountain } from "react-icons/fa6";
import type { IconType } from "react-icons";

function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();

  const categoryIcons: Record<string, IconType> = {
    Music: FaMicrophone,
    Sports: MdSportsFootball,
    Comedy: MdTheaterComedy,
    Food: IoFastFoodSharp,
    Art: FaPaintbrush,
    Adventure: FaMountain,
    Entertainment: FaLaughSquint,
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/v1/categories`);
        setCategories(response.data.categories || []);
      } catch (error) {
        console.log("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    // Navigate with the category query param
    navigate(`/events?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <section className="category-section">
      <div className="section-heading">
        <p>YOUR MOOD</p>
        <h2>Curate Your Vibe</h2>
        <span>Live music, underground comedy, street food, and late-night sets.</span>
      </div>

      <div className="category-grid">
        {categories
          .filter((category) => category.is_active)
          .map((category) => {
            const CategoryIcon = categoryIcons[category.name];

            return (
              <div
                className="category-card"
                key={category.id}
                onClick={() => handleCategoryClick(category.name)}
                style={{ cursor: "pointer" }}
              >
                <div className="category-icon" aria-label={category.name}>
                  {CategoryIcon ? <CategoryIcon /> : null}
                </div>
                <h2>{category.name}</h2>
              </div>
            );
          })}
      </div>
    </section>
  );
}

export default CategorySection;