"use client";

import { Button, type ButtonProps } from "@mantine/core";
import Link from "next/link";

export function LinkButton({ href, children, ...props }: ButtonProps & { href: string }) { return <Button component={Link} href={href} {...props}>{children}</Button>; }
