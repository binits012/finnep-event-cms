import { Breadcrumbs } from "@mui/material";
import Link from "next/link";

const CustomBreadcrumbs = ({ title, links }) => {
  return (
    <div style={{ margin: "20px 0" }}>
      <div className="breadcrumb-global">
        <Breadcrumbs aria-label="breadcrumb" separator=">">
          {links.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              style={{
                fontSize: "18px",
                textDecoration: "none",
                color: !link.active ? "#789867" : "#090909",
                pointerEvents: link.active ? "none" : "initial",
              }}
            >
              {link.title}
            </Link>
          ))}
          {/* <Link
          underline="hover"
          color="inherit"
          href="/addaircraft"
          style={{
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          {`${editMode ? "Edit" : "Add"} Aircraft`}
        </Link> */}
          {/* <Text color="text.primary">Breadcrumbs</Text> */}
        </Breadcrumbs>
        {/* <Text
        content={`${editMode ? "Edit" : "Add New"} Aircraft`}
        size={28}
        color="var(--gray-900)"
        style={{
          display: "block",
          fontWeight: "700",
        }}
      /> */}
      </div>
      <h1>{title}</h1>
    </div>
  );
};

export default CustomBreadcrumbs;
