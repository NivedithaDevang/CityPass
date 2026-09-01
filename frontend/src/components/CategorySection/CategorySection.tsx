import "./CategorySection.css";

import Adventure from "../../../public/categories/adventure.jpeg";
import Art from "../../../public/categories/art.jpeg";
import Comedy from "../../../public/categories/comedy.jpeg";
import Entertainment from "../../../public/categories/entertainment.jpeg";
import Food from "../../../public/categories/food.jpeg";
import Music from "../../../public/categories/music.jpeg";
import Sports from "../../../public/categories/sports.jpeg";

function CategorySection() {
  const categories = [
    "Music",
    "Sports",
    "Comedy",
    "Food",
    "Art&Culture",
    "Adventure",
    "Entertainment",
  ];

  const categoryImages: Record<string, string> = {
    Music: Music,
    Sports: Sports,
    Comedy: Comedy,
    Food: Food,
    "Art&Culture": Art,
    Adventure: Adventure,
    Entertainment: Entertainment,
  };

  return (
    <section className="category-section">
      <div className="section-heading">
        <p>EXPLORE</p>
        <h2>EVENTS HAPPENING</h2>
      </div>

      <div className="category-grid">
        {categories.map((category) => (
          <div
            className="category-card"
            key={category}
            style={{
              backgroundImage: `url(${categoryImages[category]})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              
            }}
          >
            <h3>{category}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CategorySection;
