import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="text-center py-16 space-y-4">
      <h1 className="text-4xl">Lost in the woods</h1>
      <p className="text-relic-parchment/60">
        That relic isn't on this shelf.
      </p>
      <Link to="/" className="btn-primary">
        Back to the home page
      </Link>
    </div>
  );
}
