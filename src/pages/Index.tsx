import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login page - this component is now just a fallback
    navigate("/");
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Redirecting...</h1>
        <p className="text-xl text-muted-foreground">Taking you to the login page</p>
      </div>
    </div>
  );
};

export default Index;
