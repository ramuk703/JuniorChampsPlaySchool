function getStudentPhotoUrl(photo) {
  if (!photo) {
    return "";
  }

  if (typeof photo === "string") {
    return photo.trim();
  }

  if (typeof photo === "object") {
    return (
      photo.url ||
      photo.fileUrl ||
      photo.thumbnailUrl ||
      photo.imageUrl ||
      photo.filePath ||
      ""
    );
  }

  return "";
}

function getInitials(firstName = "", lastName = "") {
  const initials = `${firstName?.charAt(0) || ""}${
    lastName?.charAt(0) || ""
  }`.toUpperCase();

  return initials || "S";
}

function StudentAvatar({
  student,
  size = "md",
  className = "",
}) {
  const photoUrl = getStudentPhotoUrl(student?.photo);

  const sizes = {
    sm: "h-10 w-10 text-sm",
    md: "h-14 w-14 text-lg",
    lg: "h-20 w-20 text-2xl",
    xl: "h-28 w-28 text-3xl",
  };

  const sizeClass = sizes[size] || sizes.md;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-200 font-bold text-slate-700 ${sizeClass} ${className}`}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`${student?.firstName || "Student"} ${
            student?.lastName || ""
          }`.trim()}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span>
          {getInitials(student?.firstName, student?.lastName)}
        </span>
      )}
    </div>
  );
}

export default StudentAvatar;
