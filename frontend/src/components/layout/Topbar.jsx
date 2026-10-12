import { useEffect, useRef, useState } from "react";
import {
  FiBell,
  FiChevronDown,
  FiMenu,
  FiSearch,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { globalSearch } from "../../services/globalSearchService";
import { logout } from "../../store/authSlice";

function Topbar({ onMenuClick }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);

  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState({
    students: [],
    teachers: [],
    parents: [],
    fees: [],
  });
  const [searchLoading, setSearchLoading] = useState(false);

  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const searchTimerRef = useRef(null);

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AD";

  useEffect(() => {
    const handlePointerDown = (event) => {
      const clickedInsideDesktopSearch =
        searchRef.current &&
        searchRef.current.contains(event.target);

      const clickedInsideMobileSearch =
        mobileSearchRef.current &&
        mobileSearchRef.current.contains(event.target);

      if (!clickedInsideDesktopSearch && !clickedInsideMobileSearch) {
        setSearchOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const keyword = searchKeyword.trim();

    if (!keyword) {
      return undefined;
    }

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);

      try {
        const results = await globalSearch(keyword);
        setSearchResults(results);
      } catch (error) {
        console.error("Global search failed:", error);
        setSearchResults({
          students: [],
          teachers: [],
          parents: [],
          fees: [],
        });
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchKeyword]);

  const handleLogout = () => {
    setProfileOpen(false);
    dispatch(logout());
  };

  const handleSearchResult = (type) => {
    setSearchOpen(false);
    setSearchKeyword("");

    if (type === "student") {
      navigate("/admin/students");
    } else if (type === "teacher") {
      navigate("/admin/teachers");
    } else if (type === "parent") {
      navigate("/admin/parents");
    } else if (type === "fee") {
      navigate("/admin/fees");
    }
  };

  const totalResults =
    searchResults.students.length +
    searchResults.teachers.length +
    searchResults.parents.length +
    searchResults.fees.length;

  const getStudentName = (student) =>
    student?.name ||
    `${student?.firstName || ""} ${student?.lastName || ""}`.trim() ||
    "Student";

  const getTeacherName = (teacher) =>
    teacher?.name ||
    `${teacher?.firstName || ""} ${teacher?.lastName || ""}`.trim() ||
    "Teacher";

  const getParentName = (parent) =>
    parent?.name ||
    `${parent?.fatherName || ""} ${parent?.motherName || ""}`.trim() ||
    "Parent";

  const getFeeStudentName = (fee) =>
    fee?.student?.name ||
    fee?.studentName ||
    fee?.name ||
    "Fee Payment";

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur">
      {searchOpen ? (
        <div
          ref={mobileSearchRef}
          className="absolute inset-x-0 top-16 z-50 border-b border-slate-200 bg-white p-3 shadow-lg md:hidden"
        >
          <div className="relative">
            <FiSearch
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              autoFocus
              type="search"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Search students, teachers, parents..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200"
              aria-label="Mobile global search"
            />

            <button
              type="button"
              onClick={() => {
                if (searchTimerRef.current) {
                  clearTimeout(searchTimerRef.current);
                  searchTimerRef.current = null;
                }

                setSearchKeyword("");
                setSearchOpen(false);
                setSearchLoading(false);
                setSearchResults({
                  students: [],
                  teachers: [],
                  parents: [],
                  fees: [],
                });
              }}
              aria-label="Close search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <FiX size={17} />
            </button>
          </div>

          {searchKeyword.trim() ? (
            <div className="mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              {searchLoading ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  Searching...
                </div>
              ) : totalResults === 0 ? (
                <div className="px-4 py-6 text-center">
                  <FiSearch className="mx-auto mb-2 text-slate-300" size={24} />
                  <p className="text-sm font-medium text-slate-700">
                    No results found
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Try another name, email, or keyword.
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {searchResults.students.length > 0 ? (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Students
                      </div>

                      {searchResults.students.map((student) => (
                        <button
                          key={student._id}
                          type="button"
                          onClick={() => handleSearchResult("student")}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <FiUser size={17} />
                          </span>

                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-800">
                              {getStudentName(student)}
                            </span>
                            <span className="block truncate text-xs text-slate-400">
                              Student
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {searchResults.teachers.length > 0 ? (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Teachers
                      </div>

                      {searchResults.teachers.map((teacher) => (
                        <button
                          key={teacher._id}
                          type="button"
                          onClick={() => handleSearchResult("teacher")}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <FiUser size={17} />
                          </span>

                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-800">
                              {getTeacherName(teacher)}
                            </span>
                            <span className="block truncate text-xs text-slate-400">
                              Teacher
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {searchResults.parents.length > 0 ? (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Parents
                      </div>

                      {searchResults.parents.map((parent) => (
                        <button
                          key={parent._id}
                          type="button"
                          onClick={() => handleSearchResult("parent")}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                            <FiUsers size={17} />
                          </span>

                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-800">
                              {getParentName(parent)}
                            </span>
                            <span className="block truncate text-xs text-slate-400">
                              Parent
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {searchResults.fees.length > 0 ? (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Fees
                      </div>

                      {searchResults.fees.map((fee) => (
                        <button
                          key={fee._id}
                          type="button"
                          onClick={() => handleSearchResult("fee")}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                            ₹
                          </span>

                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-800">
                              {getFeeStudentName(fee)}
                            </span>
                            <span className="block truncate text-xs text-slate-400">
                              Fee payment
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
        >
          <FiMenu size={21} />
        </button>

        <div ref={searchRef} className="relative hidden min-w-0 flex-1 md:block">
          <FiSearch
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={searchKeyword}
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => {
              setSearchKeyword(event.target.value);
              setSearchOpen(true);
            }}
            placeholder="Search students, teachers, parents..."
            className="h-10 w-full max-w-xl rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200"
            aria-label="Global search"
          />

          {searchKeyword ? (
            <button
              type="button"
              onClick={() => {
                if (searchTimerRef.current) {
                  clearTimeout(searchTimerRef.current);
                  searchTimerRef.current = null;
                }

                setSearchKeyword("");
                setSearchOpen(false);
                setSearchLoading(false);
                setSearchResults({
                  students: [],
                  teachers: [],
                  parents: [],
                  fees: [],
                });
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <FiX size={16} />
            </button>
          ) : null}

          {searchOpen && searchKeyword.trim() ? (
            <div className="absolute left-0 top-full z-50 mt-2 w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              {searchLoading ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  Searching...
                </div>
              ) : totalResults === 0 ? (
                <div className="px-4 py-6 text-center">
                  <FiSearch className="mx-auto mb-2 text-slate-300" size={24} />
                  <p className="text-sm font-medium text-slate-700">
                    No results found
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Try another name, email, or keyword.
                  </p>
                </div>
              ) : (
                <div className="max-h-[70vh] overflow-y-auto py-2">
                  {searchResults.students.length > 0 ? (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Students
                      </div>

                      {searchResults.students.map((student) => (
                        <button
                          key={student._id}
                          type="button"
                          onClick={() => handleSearchResult("student")}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <FiUser size={17} />
                          </span>

                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-800">
                              {getStudentName(student)}
                            </span>
                            <span className="block truncate text-xs text-slate-400">
                              Student
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {searchResults.teachers.length > 0 ? (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Teachers
                      </div>

                      {searchResults.teachers.map((teacher) => (
                        <button
                          key={teacher._id}
                          type="button"
                          onClick={() => handleSearchResult("teacher")}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <FiUser size={17} />
                          </span>

                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-800">
                              {getTeacherName(teacher)}
                            </span>
                            <span className="block truncate text-xs text-slate-400">
                              Teacher
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {searchResults.parents.length > 0 ? (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Parents
                      </div>

                      {searchResults.parents.map((parent) => (
                        <button
                          key={parent._id}
                          type="button"
                          onClick={() => handleSearchResult("parent")}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                            <FiUsers size={17} />
                          </span>

                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-800">
                              {getParentName(parent)}
                            </span>
                            <span className="block truncate text-xs text-slate-400">
                              Parent
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {searchResults.fees.length > 0 ? (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Fees
                      </div>

                      {searchResults.fees.map((fee) => (
                        <button
                          key={fee._id}
                          type="button"
                          onClick={() => handleSearchResult("fee")}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                            ₹
                          </span>

                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-800">
                              {getFeeStudentName(fee)}
                            </span>
                            <span className="block truncate text-xs text-slate-400">
                              Fee payment
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => {
            if (searchTimerRef.current) {
              clearTimeout(searchTimerRef.current);
              searchTimerRef.current = null;
            }

            setSearchKeyword("");
            setSearchLoading(false);
            setSearchResults({
              students: [],
              teachers: [],
              parents: [],
              fees: [],
            });
            setSearchOpen(true);
          }}
          aria-label="Open search"
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 md:hidden"
        >
          <FiSearch size={20} />
        </button>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <FiBell size={20} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {initials}
              </span>

              <span className="hidden text-left sm:block">
                <span className="block max-w-32 truncate text-sm font-semibold text-slate-700">
                  {user?.name || "Administrator"}
                </span>
                <span className="block text-xs text-slate-400">
                  Administrator
                </span>
              </span>

              <FiChevronDown
                size={17}
                className={`hidden text-slate-400 transition-transform sm:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
              >
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {user?.name || "Administrator"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {user?.email || "Admin account"}
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium capitalize text-slate-600">
                    {user?.role || "admin"}
                  </span>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
