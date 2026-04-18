import { useState } from "react";
import { calculatorApi } from "../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const FACTOR_TYPES = [
  "Maternity LSCS",
  "Maternity Normal Delivery",
  "Cataract Sublimit Change",
  "Change in SI",
  "OPD",
  "Copay",
  "Change in Room Rent",
  "Additional Corporate buffer",
  "Business Approval",
  "Profitable business- LR is less than 100",
  "Cross Business Impact",
  "Other Loading / Discounting 1",
  "Other Loading / Discounting 2",
  "Other Loading / Discounting 3",
];

export default function PremiumCalculatorPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [factors, setFactors] = useState(
    FACTOR_TYPES.map((factor) => ({
      factor,
      loading: "",
      discount: "",
      loadingDiscountAmountBurnCost: "",
      loadingDiscountAmountEnrollment: "",
      expiringLimit: "",
      proposedLimit: "",
    }))
  );

  // Base inputs
  const [baseInputs, setBaseInputs] = useState({
    finalEnrollmentPrem: 100000,
    claimCost: 80000,
    averageLives: 100,
    closingLives: 100,
    inceptionPremiumPerlife: 1000,
    lossRatio: 65,
    policyNo: "",
  });

  const handleBaseInputChange = (field, value) => {
    setBaseInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleFactorChange = (index, field, value) => {
    const newFactors = [...factors];
    newFactors[index] = { ...newFactors[index], [field]: value };
    setFactors(newFactors);
  };

  const calculateAllFactors = async () => {
    setLoading(true);
    try {
      const factorsData = factors.map((f) => [
        f.factor,
        f.loading,
        f.discount,
        f.loadingDiscountAmountBurnCost,
        f.loadingDiscountAmountEnrollment,
        f.expiringLimit,
        f.proposedLimit,
      ]);

      const response = await calculatorApi.calculate({
        final_enrollment_prem: parseFloat(baseInputs.finalEnrollmentPrem) || 0,
        claim_cost: parseFloat(baseInputs.claimCost) || 0,
        average_lives: parseInt(baseInputs.averageLives) || 0,
        closing_lives: parseInt(baseInputs.closingLives) || 0,
        inception_premium_perlife: parseFloat(baseInputs.inceptionPremiumPerlife) || 0,
        loss_ratio: parseFloat(baseInputs.lossRatio) || 0,
        policy_no: baseInputs.policyNo,
        factors: factorsData,
      });

      setResult(response.data);
    } catch (error) {
      console.error("Calculation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSingleFactor = async (index) => {
    const factor = factors[index];
    try {
      const params = {
        factor_type: factor.factor,
        loading: factor.loading,
        discount: factor.discount,
        expiring_limit: factor.expiringLimit,
        proposed_limit: factor.proposedLimit,
        final_enrollment_prem: parseFloat(baseInputs.finalEnrollmentPrem) || 0,
        claim_cost: parseFloat(baseInputs.claimCost) || 0,
        average_lives: parseInt(baseInputs.averageLives) || 0,
        closing_lives: parseInt(baseInputs.closingLives) || 0,
        loss_ratio: parseFloat(baseInputs.lossRatio) || 0,
      };

      const response = await calculatorApi.calculateFactor(params);
      const factorResult = response.data;

      const newFactors = [...factors];
      newFactors[index] = {
        ...newFactors[index],
        loading: factorResult.loading || "",
        discount: factorResult.discount || "",
        loadingDiscountAmountBurnCost: factorResult.loading_discount_amount_burn_cost || "",
        loadingDiscountAmountEnrollment: factorResult.loading_discount_amount_enrollment || "",
      };
      setFactors(newFactors);
    } catch (error) {
      console.error("Factor calculation error:", error);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return "-";
    const num = parseFloat(value);
    return isNaN(num) ? value : `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Premium Calculator</h1>
          <p className="text-muted-foreground">Calculate GMC premium with adjustment factors</p>
        </div>
      </div>

      <Tabs defaultValue="calculator" className="w-full">
        <TabsList>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          {/* Base Inputs */}
          <Card>
            <CardHeader>
              <CardTitle>Base Parameters</CardTitle>
              <CardDescription>Enter the base premium calculation parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="finalEnrollmentPrem">Final Enrollment Premium (₹)</Label>
                  <Input
                    id="finalEnrollmentPrem"
                    type="number"
                    value={baseInputs.finalEnrollmentPrem}
                    onChange={(e) => handleBaseInputChange("finalEnrollmentPrem", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimCost">Claim Cost (₹)</Label>
                  <Input
                    id="claimCost"
                    type="number"
                    value={baseInputs.claimCost}
                    onChange={(e) => handleBaseInputChange("claimCost", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="averageLives">Average Lives</Label>
                  <Input
                    id="averageLives"
                    type="number"
                    value={baseInputs.averageLives}
                    onChange={(e) => handleBaseInputChange("averageLives", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closingLives">Closing Lives</Label>
                  <Input
                    id="closingLives"
                    type="number"
                    value={baseInputs.closingLives}
                    onChange={(e) => handleBaseInputChange("closingLives", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inceptionPremiumPerlife">Inception Premium Per Life (₹)</Label>
                  <Input
                    id="inceptionPremiumPerlife"
                    type="number"
                    value={baseInputs.inceptionPremiumPerlife}
                    onChange={(e) => handleBaseInputChange("inceptionPremiumPerlife", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lossRatio">Loss Ratio (%)</Label>
                  <Input
                    id="lossRatio"
                    type="number"
                    value={baseInputs.lossRatio}
                    onChange={(e) => handleBaseInputChange("lossRatio", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policyNo">Policy Number</Label>
                  <Input
                    id="policyNo"
                    value={baseInputs.policyNo}
                    onChange={(e) => handleBaseInputChange("policyNo", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Factor Inputs */}
          <Card>
            <CardHeader>
              <CardTitle>Adjustment Factors</CardTitle>
              <CardDescription>Configure loading and discount factors for premium calculation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Factor</TableHead>
                      <TableHead>Loading (%)</TableHead>
                      <TableHead>Discount (%)</TableHead>
                      <TableHead>Expiring Limit (₹)</TableHead>
                      <TableHead>Proposed Limit (₹)</TableHead>
                      <TableHead>Burn Cost Impact (₹)</TableHead>
                      <TableHead>Enrollment Impact (₹)</TableHead>
                      <TableHead className="w-24">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factors.map((factor, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-sm">{factor.factor}</TableCell>
                        <TableCell>
                          <Input
                            placeholder="%"
                            value={factor.loading}
                            onChange={(e) => handleFactorChange(index, "loading", e.target.value)}
                            className="h-8 w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="%"
                            value={factor.discount}
                            onChange={(e) => handleFactorChange(index, "discount", e.target.value)}
                            className="h-8 w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="₹"
                            value={factor.expiringLimit}
                            onChange={(e) => handleFactorChange(index, "expiringLimit", e.target.value)}
                            className="h-8 w-28"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="₹"
                            value={factor.proposedLimit}
                            onChange={(e) => handleFactorChange(index, "proposedLimit", e.target.value)}
                            className="h-8 w-28"
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          {factor.loadingDiscountAmountBurnCost || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {factor.loadingDiscountAmountEnrollment || "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => calculateSingleFactor(index)}
                            disabled={loading}
                          >
                            Calc
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex justify-end">
                <Button onClick={calculateAllFactors} disabled={loading}>
                  {loading ? "Calculating..." : "Calculate All Factors"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          {result ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Premium Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700">Final Premium</p>
                      <p className="text-2xl font-bold text-green-800">
                        ₹{result.final_premium?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">Burn Cost Premium</p>
                      <p className="text-2xl font-bold text-blue-800">
                        ₹{result.burn_cost_premium?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-700">Enrollment Premium</p>
                      <p className="text-2xl font-bold text-purple-800">
                        ₹{result.enrollment_premium?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  {result.policy_no && (
                    <p className="mt-4 text-sm text-muted-foreground">Policy: {result.policy_no}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Factor Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Factor</TableHead>
                        <TableHead>Loading</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Burn Cost Impact (₹)</TableHead>
                        <TableHead>Enrollment Impact (₹)</TableHead>
                        <TableHead>Expiring Limit</TableHead>
                        <TableHead>Proposed Limit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.factors?.map((factor, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{factor.factor}</TableCell>
                          <TableCell>{factor.loading || "-"}</TableCell>
                          <TableCell>{factor.discount || "-"}</TableCell>
                          <TableCell>{formatCurrency(factor.loading_discount_amount_burn_cost)}</TableCell>
                          <TableCell>{formatCurrency(factor.loading_discount_amount_enrollment)}</TableCell>
                          <TableCell>{factor.expiring_limit || "-"}</TableCell>
                          <TableCell>{factor.proposed_limit || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No calculation results yet. Go to Calculator tab and click "Calculate All Factors"
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}