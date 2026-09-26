import { Button } from "./Button";
import type { PressableProps } from "react-native";

type PrimaryButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
};

export function PrimaryButton(props: PrimaryButtonProps) {
  return <Button variant="primary" {...props} />;
}
