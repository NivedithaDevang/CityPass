import "./CategorySection.css";


function CategorySection() {
  const categories = [
    "Music",
    "Sports",
    "Comedy",
    "Food",
    "Art",
    "Adventure",
    "Entertainment",
  ];

const categoryImages: Record<string, string> = {
  Music: "../public/categories/music.jpeg",
  Sports: "../public/categories/sports.jpeg",
  Comedy: "../public/categories/comedy.jpeg",
  Food: "../public/categories/food.jpeg",
  Art: "../public/categories/art.jpeg",
  Adventure: "../public/categories/adventure.jpeg",
  Entertainment: "../public/categories/entertainment.jpeg",


}
 
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
