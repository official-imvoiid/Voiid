import { useContent } from "../../content/ContentContext";
import Header from "./Header";
import Board from "./Board";
import Footer from "./Footer";

/* The home page: Header, Board (the card grid), Footer.
   Looks:  common/styles/pages/home/
   Sizes:  platforms/<device>/home/
   Links and social handles come from the content store (/admin). */
const Home = () => {
  const { links, social } = useContent();

  return (
    <div className="portfolio">
      <Header cvHref={links.cv} />
      <Board links={links} />
      <Footer social={social} />
    </div>
  );
};

export default Home;
