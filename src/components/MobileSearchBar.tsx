"use client";

import {
  useCallback,
  useRef,
  useState,
} from "react";
import type { Dispatch, SetStateAction } from "react";
import { categories, defaultRadius } from "../../libs/helpers";
import { faMoneyBillWave } from "@fortawesome/free-solid-svg-icons";
import LabelRadioButton from "./LabelRadioButton";
import SubmitButton from "./SubmitButton";
import DistancePicker from "./DistancePicker";
import type { Location } from "@/libs/location";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useRadius from "../hooks/useRadius";
import SkillTags from "./SkillTags";
import { IoMdCloseCircleOutline } from "react-icons/io";

type Props = {
  onSearch: (formData: FormData) => void;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export default function MobileSearchBar({
  onSearch,
  isOpen,
  setIsOpen,
}: Props) {
  const [tags, setTags] = useState<string[]>([]); // New state for tags
  const [tagsFilter, setTagsFilter] = useState("");
  const radius = useRadius((state) => state.radius);
  const setRadius = useRadius((state) => state.setRadius);
  const center = useCurrentLocation((state) => state.currLocation);
  const setCenter = useCurrentLocation((state) => state.setCurrLocation);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const formRef = useRef<HTMLFormElement | null>(null);

  function handleMinPriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    setMinPrice(e.target.value);
  }

  function handleMaxPriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    setMaxPrice(e.target.value);
  }

  function handleCategoryChange(category: string) {
    setSelectedCategory(category);
    const formData = new FormData(formRef.current!);
    formData.set("category", category);
    formData.set("input_tags", tagsFilter);
    onSearch(formData);
  }

  function handleTagsChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTagsFilter(e.target.value);
  }

  const handleDistanceChange = useCallback(
    ({ radius, center }: { radius: number; center: Location }) => {
      setRadius(radius);
      setCenter(center);
    },
    [setCenter, setRadius]
  );

  return isOpen ? (
    <div
      className="fixed inset-0 z-40 bg-black bg-opacity-50 flex justify-center items-start pt-24"
    >
      <form
        ref={formRef}
        action={onSearch}
        className="bg-white w-[90%] max-w-md p-6 rounded-md shadow-lg z-50 overflow-y-auto max-h-[80vh] relative"
      >
        <button
          type="button"
          aria-label="Close search filters"
          className="absolute left-0 top-0 text-theme-green hover:text-green-800"
          onClick={() => setIsOpen(false)}
        >
          <IoMdCloseCircleOutline className="p-1" size={40} />
        </button>

        <div>
          <label className="mt-3 p-0" htmlFor="phraseSearch">
            Search for Quests
          </label>
          <input
            id="phraseSearch"
            name="phrase"
            type="text"
            placeholder="Search SIDEQUE$T..."
          />
        </div>

        <div>
          <SkillTags tags={tags} setTags={setTags} />
          <input
            name="input_tags"
            type="hidden"
            value={tags}
            onChange={handleTagsChange}
          />
        </div>

        <label>Preferred Quest Modality</label>
        <div className="flex flex-col gap-0">
          <LabelRadioButton
            key={"category"}
            name={"category"}
            value={""}
            icon={faMoneyBillWave}
            onClick={handleCategoryChange}
            isSelected={selectedCategory === ""}
            label={"Either"}
          />
          {categories.map(({ key: categoryKey, label, icon }) => (
            <LabelRadioButton
              key={categoryKey}
              name={"category"}
              value={categoryKey}
              icon={icon}
              onClick={handleCategoryChange}
              isSelected={selectedCategory === categoryKey}
              label={label}
            />
          ))}
        </div>

        <div>
          <label>Filter by price</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                name="min"
                type="number"
                min="0"
                step="0.1"
                onKeyDown={(e) => {
                  if (e.key === "e" || e.key === "-") e.preventDefault();
                }}
                placeholder="min"
                value={minPrice}
                onChange={handleMinPriceChange}
              />
            </div>
            <div>
              <input
                name="max"
                type="number"
                min="0"
                step="0.1"
                onKeyDown={(e) => {
                  if (e.key === "e" || e.key === "-") e.preventDefault();
                }}
                placeholder="max"
                value={maxPrice}
                onChange={handleMaxPriceChange}
              />
            </div>
          </div>
        </div>

        <div>
          <input type="hidden" name="radius" value={radius} />
          <input
            type="hidden"
            name="center"
            value={center ? `${center.lat},${center.lng}` : ""}
            disabled={!center}
          />
          <DistancePicker
            defaultRadius={defaultRadius}
            onChange={handleDistanceChange}
          />
        </div>

        <SubmitButton>Search</SubmitButton>
      </form>
    </div>
  ) : null;
}
