import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import theme from "../theme/enterpriseTheme";

const routeNames = {
  dashboard: "Dashboard",
  students: "Students",
  "student-journey": "Student Journey",
  reports: "Reports",
  analytics: "Analytics",
  settings: "Settings",
  profile: "Profile",
  add: "Add",
  edit: "Edit",
  details: "Details",
};

const EnterpriseBreadcrumbs = () => {
  const location = useLocation();

  // Remove "enterprise" from breadcrumb
  let pathnames = location.pathname
    .split("/")
    .filter(Boolean)
    .filter((p) => p !== "enterprise");

  // Show Students before Student Journey
  if (
    pathnames.length === 1 &&
    pathnames[0] === "student-journey"
  ) {
    pathnames = ["students", "student-journey"];
  }

  return (
    <div
      className="flex items-center gap-2 text-sm mb-6 flex-wrap"
      style={{ color: theme.colors.text.secondary }}
    >
      <Home size={16} />

      <span
        style={{
          color: theme.colors.text.primary,
          fontWeight: 600,
        }}
      >
        TrueMindPath
      </span>

      {pathnames.map((segment, index) => {
        const isLast = index === pathnames.length - 1;

        // Build link
        let to = "/enterprise";

        if (segment === "student-journey") {
          to += "/student-journey";
        } else {
          to += "/" + pathnames.slice(0, index + 1).join("/");
        }

        const label =
          routeNames[segment] ||
          segment
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

        return (
          <React.Fragment key={segment + index}>
            <ChevronRight size={15} />

            {isLast ? (
              <span
                style={{
                  color: theme.colors.text.primary,
                  // fontWeight: 600,
                }}
              >
                {label}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:opacity-80"
                style={{ color: theme.colors.text.secondary }}
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default EnterpriseBreadcrumbs;