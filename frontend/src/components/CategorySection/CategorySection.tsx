import "./CategorySection.css";

 const categoryImages: Record<string, string> = {
    Music: "./categories/music.jpeg",
    Sports: "./categories/sports.jpeg",
    Comedy: "./categories/comedy.jpeg",
    Food: "./categories/food.jpeg",
    "Art&Culture": "./categories/art.jpeg",
    Adventure: "./categories/adventure.jpeg",
    Entertainment: "./categories/entertainment.jpeg",
  };

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
