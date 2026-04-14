import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

interface LoginForm {
  email: string;
  password: string;
}

export function LoginPage() {
  const { register, handleSubmit, formState } = useForm<LoginForm>({
    defaultValues: {
      email: "admin@attendify.com",
      password: "Admin123!",
    },
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
      toast.success("Welcome to Attendify.");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Login failed.");
    }
  });

  return (
    <main className="login-page">
      <section className="login-hero">
        <p className="eyebrow">Employee Attendance Management</p>
        <h1>Attendify keeps attendance, leave, payroll, and punctuality in one place.</h1>
        <p className="hero-copy">
          Sign in with an admin, HR, manager, or employee account to explore the end-to-end workflows.
        </p>
        <div className="credential-grid">
          <div><strong>Admin</strong><span>admin@attendify.com</span><span>Admin123!</span></div>
          <div><strong>HR</strong><span>hr@attendify.com</span><span>Hr123456!</span></div>
          <div><strong>Manager</strong><span>manager@attendify.com</span><span>Manager123!</span></div>
          <div><strong>Employee</strong><span>employee@attendify.com</span><span>Employee123!</span></div>
        </div>
      </section>

      <section className="login-card">
        <h2>Login</h2>
        <form onSubmit={onSubmit} className="form-grid">
          <label>
            <span>Email</span>
            <input type="email" {...register("email", { required: true })} />
          </label>
          <label>
            <span>Password</span>
            <input type="password" {...register("password", { required: true })} />
          </label>
          <button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
