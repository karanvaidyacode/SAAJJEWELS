import { Show, RedirectToSignIn } from "@clerk/react";

const ProtectedRoute = ({ children }) => {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>
    </>
  );
};

export default ProtectedRoute;
