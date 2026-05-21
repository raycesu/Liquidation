import {
  MarketingBackdropLayers,
  type MarketingBackdropTone,
} from "@/components/marketing/marketing-backdrop-layers"

type MarketingBackdropProps = {
  tone?: MarketingBackdropTone
}

export const MarketingBackdrop = ({ tone = "default" }: MarketingBackdropProps) => {
  return <MarketingBackdropLayers tone={tone} />
}
